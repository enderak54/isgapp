import { Pool } from "pg";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Auth katmanı — doğrudan PostgreSQL (DATABASE_URL) üzerinden çalışır.
// app_users / app_sessions tabloları RLS deny-all olduğundan supabase client
// (anon key) erişemez; yalnızca bu katman ve create-user script'i kullanır.

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
