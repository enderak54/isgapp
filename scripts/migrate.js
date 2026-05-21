const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("HATA: DATABASE_URL bulunamadı!");
    console.error(".env.local dosyasına Supabase Database URI'sini ekleyin:");
    console.error("DATABASE_URL=postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres");
    console.error("");
    console.error("Supabase Dashboard → Settings → Database → Connection string → URI (psql)");
    process.exit(1);
  }

  const client = new Client(databaseUrl);
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz DEFAULT now()
      );
    `);

    const { rows: applied } = await client.query("SELECT version FROM schema_migrations ORDER BY version");
    const appliedSet = new Set(applied.map((r) => r.version));

    const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const pending = files.filter((f) => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log("✅ Tüm migration'lar zaten uygulanmış.");
      return;
    }

    console.log(`📦 ${pending.length} migration uygulanacak:\n`);

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      console.log(`  ⏳ ${file}...`);

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`  ✅ ${file} uygulandı`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  ❌ ${file} başarısız: ${err.message}`);
        process.exit(1);
      }
    }

    console.log(`\n🎉 ${pending.length} migration başarıyla uygulandı!`);
  } finally {
    await client.end();
  }
}

runMigrations().catch((err) => {
  console.error("Migration hatası:", err.message);
  process.exit(1);
});
