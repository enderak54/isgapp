# isgapp — Self-Host Paketi

Bu dizin, **isgapp** uygulamasını resmi Supabase stack'i ile birlikte tek Docker Compose
dosyasından ayağa kaldırmak için gereken her şeyi içerir.

- **Supabase**: tam stack (Studio, Kong, Auth, PostgREST, Realtime, Storage, Edge Functions, Supavisor)
- **isgapp**: Next.js uygulaması (kendi servisi olarak çalışır)
- **Şema**: `init.sql` — canlı veritabanından alınan isgapp tabloları (veri taşınmaz, yalnızca şema)
- **Giriş**: kullanıcı adı + şifre (uygulama-seviyesi auth) — kurulum sonrası ilk kullanıcıyı `create-user` ile açın

> ⚠️ **Veri taşınmaz.** Yalnızca şema kurulur; veriler boş başlar.

---

## Gereksinimler

**Desteklenen platformlar:**

- **Linux sunucu** (Debian/Ubuntu veya RHEL ailesi önerilir)
- **Windows 10/11** — Docker Desktop + **Git Bash** (Git for Windows kurulumuyla gelir; komutlar `sh` ile çalıştırılır)

Her iki platformda da:

- **Docker Engine** (20.10+) + **Compose plugin** v2 (Windows'ta Docker Desktop)
- **4–8 GB RAM** (Supabase stack için önerilen minimum), 20+ GB disk
- `openssl` (Windows'ta Git Bash içinde gelir)
- `node >= 16` **veya** Docker (`add-new-auth-keys.sh` key üretimi için; node yoksa docker fallback kullanır)
- `git`, `npm` (ilk kullanıcıyı `create-user` script'i ile açmak için)

> 💡 **isgapp imajı hedef makinede derlenir.** `docker compose build isgapp`
> kaynak koddan build eder — hazır imaj indirilmez, tedarik zinciri riski yoktur.
> Bu nedenle `git clone` ile tüm repo hedef makineye alınır.

---

## Kurulum (önerilen)

> 📖 **Adım adım, sorun gidermeli ayrıntılı rehber: [KURULUM.md](KURULUM.md)**
> (Windows WSL2 + Docker Desktop ve Linux kurulumunu uçtan uca, her adımın doğrulamasıyla anlatır.)

```bash
# 1) Repo'yu hedef makineye alın
git clone https://github.com/enderak54/isgapp.git
cd isgapp/self-host

# 2) Kurulumu başlatın
sh kur.sh           # tam otomatik (Docker eksikse Linux'ta kurar)
sh setup.sh         # yalnızca stack kurulumu (Docker'ın hazır olduğu varsayılır)
```

- **Linux:** `kur.sh` Docker/Compose plugin/git/openssl eksikse otomatik kurar ve
  `setup.sh -y` ile kurulumu tamamlar (hiçbir soru sormaz).
- **Windows:** Docker Desktop kuruluysa `sh kur.sh` devam eder; değilse kurulum
  komutunu gösterir. Windows'ta her şeyi **Git Bash**'ten çalıştırın
  (`sh kur.sh` — `kur.sh` değil; doğrudan çalıştırmak Windows'ta çalışmaz).

`setup.sh` şunları yapar:

1. `.env` oluşturur (`.env.example`'dan kopyalar)
2. Tüm sırları üretir: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`,
   `SERVICE_ROLE_KEY`, asimetrik key çifti + opak API key'ler, `BACKUP_API_KEY`,
   `UPDATER_API_KEY`
3. URL'leri sorar (varsayılan: `http://localhost:8000` ve `http://localhost:3000`)
4. Docker imajlarını çeker, **isgapp ve isgapp-updater'i kaynak koddan derler** ve stack'i başlatır

### Manuel kurulum

```bash
cd self-host
cp .env.example .env
# .env içindeki TÜM şifreleri değiştirin
sh utils/generate-keys.sh --update-env
sh utils/add-new-auth-keys.sh --update-env
openssl rand -hex 24 >> /dev/null   # BACKUP_API_KEY üretin ve .env'e yazın
docker compose up -d
```

---

## Erişim

| Servis | Adres |
|---|---|
| isgapp (uygulama) | http://localhost:3000 |
| Supabase Studio | http://localhost:8000 |
| REST API | http://localhost:8000/rest/v1 |
| Auth API | http://localhost:8000/auth/v1 |
| Postgres (pooler) | localhost:5432 (session) / 6543 (transaction) |

Studio'ya giriş: `.env` içindeki `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`.

---

## Güncelleme (isgapp)

Self-host kurulumunuzu repo'daki yeni sürüme taşımak için **iki yol** vardır:

### 1. Uygulama içinden (Ayarlar > Sürüm Takip > Güncelle)

Giriş yapın, **Ayarlar → Sürüm Takip → Güncelle**'ye basın. `isgapp-updater`
servisi `update.sh`'ı çalıştırır: önce yedek alır, sonra günceller ve yeniden
başlatır. İlerlemeyi aynı karttan izleyebilirsiniz.

> **Gereksinim:** kurulumda `isgapp-updater` servisinin ayağa kalkması gerekir
> (`setup.sh` bunu otomatik yapar). Eski kurulumları taşımak için bir kez:
> `docker compose build isgapp-updater && docker compose --profile updater up -d isgapp-updater`

### 2. Terminalden

```bash
cd self-host
sh update.sh                 # yedek al + git pull + yeni migrasyonlar + isgapp rebuild
sh update.sh -n              # yedek almadan
```

Windows'ta yine **Git Bash**'ten `sh update.sh` çalıştırın.

`update.sh` sırayla şunları yapar:

1. **Yedek alır** (`backup.sh` — güncelleme öncesi her zaman)
2. **Repo'yu günceller** (`git pull --ff-only`)
3. **Yeni DB migrasyonlarını uygular** — `supabase/migrations/*.sql` içinden yalnızca
   `.applied_migrations` dosyasında olmayanlar, sırayla `psql` ile.
4. **isgapp ve isgapp-updater imajlarını yeniden derler** ve stack'i günceller.

> **Migrasyon takibi:** Kurulumda `init.sql` mevcut tüm migrasyonları kapsar;
> `setup.sh` hepsini `.applied_migrations`'a kaydeder. Sonraki sürümlerde
> yalnızca **yeni eklenen** migrasyon dosyaları uygulanır. Bu dosya kuruluma
> özgüdür ve git'e alınmaz.
>
> ⚠️ `.applied_migrations` yoksa (elle kurulan eski kurulum), ilk çalıştırmada
> mevcut migrasyonlar "uygulanmış" sayılır; yalnızca yeni dosyalar işlenir.
> Kurulumdaki `init.sql`'den daha eski bir migrasyon eksikse elle uygulanmalıdır.

### Veri Kayıpsız Güncelleme Garantisi

`update.sh` **hiçbir kullanıcı verisini silmez**. Garanti edilenler:

| Korunan | Nasıl |
|---|---|
| personel, santiyeler, taseronlar, is_kazalari, egitimler … (60+ tablo) | `docker compose up -d` volumes'u korur; migrasyonlar sadece `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `ON CONFLICT` ile ekler — `DROP/TRUNCATE` yok (152× IF NOT EXISTS, 44× ADD COLUMN IF NOT EXISTS) |
| Storage dosyaları (`volumes/storage`) | `backup.sh` + `storage.tar.gz` + yedeği doğrular; `update.sh` storage'a dokunmaz |
| `.env`, `.applied_migrations` | `backup.sh` her yedeğe `.env.bak` + `.applied_migrations.bak` + `manifest.json` + `sha256` ekler |
| Şema | `init.sql` sadece ilk kurulumda boş DB'ye uygulanır; güncellemede **asla** tekrar çalışmaz — sadece `supabase/migrations/*.sql` incremental |

**GitHub'dan güncelleme (kod + şema):**

```bash
cd self-host
sh update.sh --dry-run   # ne yapılacağını göster (git fetch + bekleyen migrasyonlar)
sh update.sh             # yedek al + git pull --ff-only + migrasyon + build + up -d + seed
```

**Supabase'ten güncelleme (Dashboard'da tablo/RLS değiştirdiysen):**

1. Değişikliği önce `supabase/migrations/YYYYMMDDHHMMSS_aciklama.sql` olarak kaydet:
   ```sql
   -- Örnek: yeni kolon ekle — mutlaka IF NOT EXISTS kullan
   ALTER TABLE public.personel ADD COLUMN IF NOT EXISTS yeni_kolon text;
   ```
   veya Supabase CLI ile: `supabase db diff -f yeni_degisiklik` (otomatik üretir) ve dosyayı `supabase/migrations/` altına taşı.
2. `git add supabase/migrations/... && git commit -m "feat: ..." && git push`
3. Lokal self-host'ta `sh update.sh` — yeni migrasyon otomatik uygulanır, veriler korunur.

> **Kural:** Supabase Studio'da doğrudan `DROP/TRUNCATE` yapma — her zaman `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` ile migrasyon yaz. Bu sayede lokal sistem veri kaybı olmadan güncellenir.

**Doğrulama & geri alma:**

```bash
sh update.sh --dry-run          # önizleme
sh backup.sh                    # manuel yedek (manifest.json ile doğrulanır)
sh restore.sh backups/2026-08-12_143000   # tek komutla geri yükleme (önce otomatik yedek alır)
# Yedek içeriği: db.dump + storage.tar.gz + .env.bak + .applied_migrations.bak + manifest.json
```

`update.sh` güncelleme öncesi `personel` sayısını sayar, sonrası `personel sayısı X -> Y (azalmamalı)` diye loglar; `backup.sh` `pg_restore -l` ile dump'ı doğrular.

---

## Giriş (Kullanıcı Adı + Şifre)

Uygulama açılışında kullanıcı adı/şifre ister (`/giris`). Auth, uygulama-seviyesidir:
- `app_users` / `app_sessions` tabloları **RLS deny-all** (anon key erişemez); şifreler `scrypt` ile hash'lenir.
- Auth API'leri (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`) doğrudan PostgreSQL
  (`DATABASE_URL`) üzerinden çalışır; oturum httpOnly cookie (`isg_session`, 7 gün).
- Tüm uygulama sayfaları ve API'ler giriş gerektirir (`proxy.ts`); `/giris` ve `/api/auth/*` public'tir.
- Her `POST/PUT/PATCH/DELETE` isteğinde CSRF doğrulaması devam eder.

İlk kullanıcıyı oluşturun (kurulumdan sonra, repo kökünde — `node` + `npm` gerekir):

```bash
npm install                 # ilk seferde bağımlılıklar
npm run create-user -- --username kullanici --password "GucluSifre123" --ad "Ad Soyad" --rol admin
```

> `create-user` script'i `DATABASE_URL`'i önce `.env.local`'dan, yoksa `self-host/.env`'den okur.
> Self-host kurulumunda `self-host/.env`'deki DB bağlantısını otomatik kullanır.
> İsterseniz doğrudan: `node scripts/create-user.js --db-url "postgresql://postgres:SIFRE@localhost:5432/postgres" --username kullanici --password SIFRE --rol admin`

Self-host'ta DB'ye doğrudan bağlantı için `DATABASE_URL` kullanılır (compose'da otomatik:
`postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres`). Harici bir DB'ye bağlanacaksanız
`.env` içinde `DATABASE_URL`'i açıkça ayarlayın.

Kullanıcı yönetimi (şifre sıfırlama, rol değiştirme) SQL ile yapılabilir — örn. Studio (Supabase) üzerinden
`public.app_users` tablosunda, ancak **şifre hash'i doğrudan değiştirmeyin**; `create-user` benzeri bir
script ile yeni kullanıcı ekleyin.

---

## Yedekleme

```bash
sh backup.sh                          # ./backups/YYYY-AA-GG_HHMMSS/ altına alır (VERI KAYIPSIZ)
sh backup.sh -o /mnt/diskbak          # özel hedef dizin
```

Yedek içeriği (doğrulanmış):

- `db.dump` — PostgreSQL custom-format dump (şema + veri) + `db.dump.sha256` + `pg_restore -l` doğrulaması
- `storage.tar.gz` — Storage dosyaları + `storage.tar.gz.sha256`
- `.env.bak`, `.applied_migrations.bak` — self-host durumu
- `manifest.json` — yedek meta (personel sayısı, git commit, byte boyutu)

### Cron ile otomatik yedekleme

```
0 2 * * * cd /path/to/self-host && sh backup.sh >> backups/backup.log 2>&1
```

### Geri yükleme (tek komut)

```bash
sh restore.sh backups/2026-08-02_103000              # DB + storage + .env/.applied_migrations (onaylı)
sh restore.sh backups/2026-08-02_103000 --only-db    # sadece DB
sh restore.sh backups/2026-08-02_103000 --only-storage # sadece storage
```

Manuel geri yükleme (alternatif):

```bash
docker compose down
docker compose run --rm db pg_restore -U postgres -d postgres -c --if-exists < backups/2026-08-02_103000/db.dump
tar -xzf backups/2026-08-02_103000/storage.tar.gz -C ./volumes
docker compose up -d
```

---

## Güvenlik Notları

⚠️ **Varsayılan yapılandırma üretim için güvenli DEĞİLDİR.** Yayınlamadan önce:

1. `.env` içindeki tüm varsayılan şifreleri değiştirin (setup.sh otomatik yapar)
2. Studio için güçlü `DASHBOARD_PASSWORD` belirleyin
3. `SUPABASE_PUBLIC_URL` ve `SITE_URL`'i gerçek alan adınıza ayarlayın
4. TLS için Caddy/Nginx proxy kullanın:
   `docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d` (`.env`'de `PROXY_DOMAIN` ve `CERTBOT_EMAIL` ayarlayın)
5. Güvenlik duvarında yalnızca gerekli portları açın (3000, 8000, 8443)
6. Storage bucket'ları `public=true` (geliştirme modu) — üretimde özel erişim kullanın

### Bilinen güvenlik açıkları (STANDARDS.md'den)

- **RLS PUBLİC (dev modu)**: isgapp veri tabloları `USING (true)` policy'si ile herkese açık.
  Üretime geçmeden önce `auth.role() = 'authenticated'` tabanlı policy'ler uygulayın.
  NOT: `app_users` / `app_sessions` tabloları bu kapsamda DEĞİLDİR — onlar deny-all'dır.
- **Storage bucket'ları public**: yukarıdaki storage policy'leri `public` rolüne açık.
- Uygulama girişi kullanıcı adı/şifre ile korunur (`/giris`); veri API'si yine anon key ile çalışır.

---

## Yönetim Komutları

```bash
docker compose ps              # servis durumu
docker compose logs -f         # tüm loglar
docker compose logs -f isgapp  # uygulama logları
docker compose up -d           # başlat
docker compose down            # durdur (veriler korunur, volumes persist)
docker compose restart db      # tek servis yeniden başlat
```

> ⚠️ **`docker compose down` verileri SİLMEZ.** `./volumes/` dizini kalıcıdır.
> Verileri silmek için ayrıca `sudo rm -rf volumes/db/data volumes/storage` gerekir.

---

## Upgrade (Supabase)

```bash
# 1. Yeni sürümü indirin (versions.md / CHANGELOG.md'yi inceleyin)
# 2. docker-compose.yml içindeki image tag'lerini güncelleyin
# 3. docker compose down
# 4. docker compose up -d
```

Upgrade öncesi **her zaman** `sh backup.sh` çalıştırın.

---

## Bilinen Sınırlamalar

- Docker kurulu değilse `docker compose build/config` doğrulanamadı (geliştirme makinesinde Docker yok)
- `init.sql` yalnızca **boş** veritabanında ilk açılışta çalışır (`/docker-entrypoint-initdb.d`).
  Var olan bir DB'ye uygulamak için `psql -f init.sql` elle çalıştırın.
- Kolla modülü tabloları (telemetry, cihazlar, kamera vb.) bilinçli olarak şemadan hariç tutulmuştur.
