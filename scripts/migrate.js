const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const fs = require("fs");
const https = require("https");

function fetchApi(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;

  if (!accessToken || !projectRef) {
    console.error("HATA: SUPABASE_ACCESS_TOKEN ve SUPABASE_PROJECT_REF bulunamadı!");
    console.error("");
    console.error(".env.local dosyasına şunları ekleyin:");
    console.error("SUPABASE_PROJECT_REF=wnbrltpughawrvdmeqhk");
    console.error("SUPABASE_ACCESS_TOKEN=your_personal_access_token");
    console.error("");
    console.error("Token almak için:");
    console.error("1. https://supabase.com/dashboard → Settings → API → Personal access tokens");
    console.error("2. Yeni token oluştur (all scopes)");
    console.error("3. .env.local'a kopyala");
    process.exit(1);
  }

  const apiUrl = `https://api.supabase.com/v1/projects/${projectRef}/sql`;

  // Check applied migrations
  const checkSql = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz DEFAULT now()
    );
    SELECT version FROM schema_migrations ORDER BY version;
  `;

  console.log("📡 Supabase API'ye bağlanılıyor...");

  const checkRes = await fetchApi(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: checkSql }),
  });

  if (checkRes.status !== 200) {
    console.error(`❌ API hatası (${checkRes.status}):`, JSON.stringify(checkRes.body));
    process.exit(1);
  }

  // Parse results - first result is CREATE TABLE (no rows), second is SELECT
  let appliedVersions = [];
  if (Array.isArray(checkRes.body)) {
    // Last result set is the SELECT
    const selectResult = checkRes.body[checkRes.body.length - 1];
    if (Array.isArray(selectResult)) {
      appliedVersions = selectResult.map((r) => r.version);
    }
  }

  const appliedSet = new Set(appliedVersions);

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
    const wrappedSql = `BEGIN; ${sql} INSERT INTO schema_migrations (version) VALUES ('${file}'); COMMIT;`;

    console.log(`  ⏳ ${file}...`);

    const res = await fetchApi(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: wrappedSql }),
    });

    if (res.status !== 200) {
      console.error(`  ❌ ${file} başarısız (${res.status}):`, JSON.stringify(res.body));
      console.error("\nBu migration'ı manuel olarak Supabase SQL Editor'da çalıştırmanız gerekebilir.");
      process.exit(1);
    }

    console.log(`  ✅ ${file} uygulandı`);
  }

  console.log(`\n🎉 ${pending.length} migration başarıyla uygulandı!`);
}

runMigrations().catch((err) => {
  console.error("Migration hatası:", err.message);
  process.exit(1);
});
