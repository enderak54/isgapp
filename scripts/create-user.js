#!/usr/bin/env node
//
// Kullanıcı oluşturma script'i.
//
// Kullanım:
//   node scripts/create-user.js --username admin --password sifre --ad "Ad Soyad" [--rol admin] [--db-url postgresql://...]
//
// Bağlantı:
//   Varsayılan: .env.local içindeki DATABASE_URL
//   Self-host:  --db-url "postgresql://postgres:PAROLA@localhost:5432/postgres"
//               (veya .env içinde DATABASE_URL tanımlıysa bu da okunur)
//
// Şifre minimum 8 karakter olmalıdır.

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
require("dotenv").config({ path: path.join(__dirname, "..", "self-host", ".env") });
const { Pool } = require("pg");
const { randomBytes, scryptSync, timingSafeEqual } = require("crypto");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const m = argv[i].match(/^--([a-z-]+)(?:=(.*))?$/);
    if (m) {
      args[m[1]] = m[2] !== undefined ? m[2] : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return args;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

async function main() {
  const args = parseArgs(process.argv);
  const username = (args.username || "").trim();
  const password = args.password || "";
  const adSoyad = args.ad || "";
  const rol = args.rol || "kullanici";
  const dbUrl = args["db-url"] || process.env.DATABASE_URL;

  if (!username || !password) {
    console.error("HATA: --username ve --password gereklidir.");
    console.error("Örnek: node scripts/create-user.js --username admin --password sifre --ad \"Ad Soyad\" --rol admin");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("HATA: Şifre en az 8 karakter olmalıdır.");
    process.exit(1);
  }
  if (!dbUrl) {
    console.error("HATA: DATABASE_URL bulunamadı. .env.local'a ekleyin veya --db-url verin.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  try {
    const existing = await pool.query("SELECT id FROM app_users WHERE username = $1", [username]);
    if (existing.rows.length > 0) {
      console.error(`HATA: '${username}' kullanıcısı zaten var.`);
      process.exit(1);
    }

    const { hash, salt } = hashPassword(password);
    const result = await pool.query(
      `INSERT INTO app_users (username, password_hash, salt, ad_soyad, rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, ad_soyad, rol`,
      [username, hash, salt, adSoyad, rol]
    );
    const u = result.rows[0];
    console.log(`✓ Kullanıcı oluşturuldu: ${u.username} (${u.rol})`);
    if (u.ad_soyad) console.log(`  Ad Soyad: ${u.ad_soyad}`);
    console.log("\nGiriş: http://localhost:3000/giris");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Hata:", err.message);
  process.exit(1);
});
