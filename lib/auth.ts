import type { NextRequest } from "next/server";
import { Pool } from "pg";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Auth katmanı — doğrudan PostgreSQL (DATABASE_URL) üzerinden çalışır.
// app_users / app_sessions tabloları RLS deny-all olduğundan supabase client
// (anon key) erişemez; yalnızca bu katman ve create-user script'i kullanır.

export const SESSION_COOKIE = "isg_session";
const SESSION_TTL_DAYS = 7;
const SCRYPT_KEYLEN = 64;

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connStr = process.env.DATABASE_URL;
    if (!connStr) throw new Error("DATABASE_URL ortam değişkeni tanımlı değil.");
    pool = new Pool({ connectionString: connStr });
  }
  return pool;
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export interface AuthUser {
  id: string;
  username: string;
  ad_soyad: string | null;
  rol: string;
}

export async function createUser(username: string, password: string, adSoyad: string, rol = "kullanici"): Promise<AuthUser> {
  const { hash, salt } = hashPassword(password);
  const result = await getPool().query(
    `INSERT INTO app_users (username, password_hash, salt, ad_soyad, rol)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, ad_soyad, rol`,
    [username.trim(), hash, salt, adSoyad, rol]
  );
  return result.rows[0];
}

export async function authenticate(username: string, password: string): Promise<AuthUser | null> {
  const result = await getPool().query(
    `SELECT id, username, password_hash, salt, ad_soyad, rol, aktif FROM app_users WHERE username = $1`,
    [username.trim()]
  );
  const user = result.rows[0];
  if (!user) return null;
  if (!user.aktif) return null;
  if (!verifyPassword(password, user.password_hash, user.salt)) return null;
  return { id: user.id, username: user.username, ad_soyad: user.ad_soyad, rol: user.rol };
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await getPool().query(
    `INSERT INTO app_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
  await getPool().query(`UPDATE app_users SET last_login_at = now() WHERE id = $1`, [userId]);
  return token;
}

export async function getUserBySession(token: string): Promise<AuthUser | null> {
  const result = await getPool().query(
    `SELECT u.id, u.username, u.ad_soyad, u.rol, u.aktif
     FROM app_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > now()`,
    [token]
  );
  const user = result.rows[0];
  if (!user) return null;
  if (!user.aktif) return null;
  return { id: user.id, username: user.username, ad_soyad: user.ad_soyad, rol: user.rol };
}

export async function deleteSession(token: string): Promise<void> {
  await getPool().query(`DELETE FROM app_sessions WHERE token = $1`, [token]);
}

// ===== Yönetici yardımcıları (kullanıcı yönetimi API'leri için) =====

export interface AdminUser {
  id: string;
  username: string;
  ad_soyad: string | null;
  rol: string;
  aktif: boolean;
  created_at: string;
  last_login_at: string | null;
}

// İstekten session kullanıcısını çözer (cookie'deki isg_session token'ı).
export async function getRequestUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserBySession(token);
}

// Yalnızca admin kullanıcı döner; değilse null.
export async function requireAdmin(request: NextRequest) {
  const user = await getRequestUser(request);
  return user?.rol === "admin" ? user : null;
}

export async function listUsers(): Promise<AdminUser[]> {
  const result = await getPool().query(
    `SELECT id, username, ad_soyad, rol, aktif, created_at, last_login_at
     FROM app_users ORDER BY username`
  );
  return result.rows;
}

export async function updateUser(
  id: string,
  fields: { ad_soyad?: string | null; rol?: string; aktif?: boolean; password?: string }
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (fields.ad_soyad !== undefined) { sets.push(`ad_soyad = $${i++}`); values.push(fields.ad_soyad); }
  if (fields.rol !== undefined) { sets.push(`rol = $${i++}`); values.push(fields.rol); }
  if (fields.aktif !== undefined) { sets.push(`aktif = $${i++}`); values.push(fields.aktif); }
  if (fields.password) {
    const { hash, salt } = hashPassword(fields.password);
    sets.push(`password_hash = $${i++}`); values.push(hash);
    sets.push(`salt = $${i++}`); values.push(salt);
  }
  if (sets.length === 0) return;
  values.push(id);
  await getPool().query(`UPDATE app_users SET ${sets.join(", ")} WHERE id = $${i}`, values);
}

export async function deleteUser(id: string): Promise<boolean> {
  const r = await getPool().query(`DELETE FROM app_users WHERE id = $1`, [id]);
  return (r.rowCount ?? 0) > 0;
}

// Denetim günlüğü — app_users gibi RLS korumalı işlemler için pg üzerinden yazılır.
export async function auditLogPg(params: {
  tableName: string;
  action: "INSERT" | "UPDATE" | "DELETE" | "ARCHIVE";
  recordId: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  actor?: string | null;
  ip?: string | null;
}): Promise<void> {
  try {
    const ip = params.ip?.trim() || null;
    await getPool().query(
      `INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, ip_address, user_agent, user_id)
       VALUES ($1, $2, $3, $4, $5, $6::inet, $7, $8)`,
      [
        params.tableName,
        params.recordId,
        params.action,
        params.oldValues ?? null,
        params.newValues ?? null,
        ip,
        null,
        params.actor ?? null,
      ]
    );
  } catch (err) {
    console.error("Audit log (pg) failed:", err);
  }
}
