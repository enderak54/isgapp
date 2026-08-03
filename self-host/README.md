# isgapp — Self-Host Paketi

Bu dizin, **isgapp** uygulamasını resmi Supabase stack'i ile birlikte tek Docker Compose
dosyasından ayağa kaldırmak için gereken her şeyi içerir.

- **Supabase**: tam stack (Studio, Kong, Auth, PostgREST, Realtime, Storage, Edge Functions, Supavisor)
- **isgapp**: Next.js uygulaması (kendi servisi olarak çalışır)
- **Şema**: `init.sql` — canlı veritabanından alınan isgapp tabloları (veri taşınmaz, yalnızca şema)

> ⚠️ **Veri taşınmaz.** Yalnızca şema kurulur; veriler boş başlar.

---

## Gereksinimler

- Linux sunucu (Debian/Ubuntu veya RHEL ailesi önerilir) veya Docker Desktop
- **Docker Engine** (20.10+) + **Compose plugin** v2
- **4–8 GB RAM** (Supabase stack için önerilen minimum), 20+ GB disk
- `openssl`, `git`, `jq` (key üretimi için)

---

## Kurulum (önerilen)

```bash
cd self-host
sh setup.sh          # interaktif kurulum (key üretimi + stack başlatma)
```

`setup.sh` şunları yapar:

1. `.env` oluşturur (`.env.example`'dan kopyalar)
2. Tüm sırları üretir: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`,
   `SERVICE_ROLE_KEY`, asimetrik key çifti + opak API key'ler, `BACKUP_API_KEY`
3. URL'leri sorar (varsayılan: `http://localhost:8000` ve `http://localhost:3000`)
4. Docker imajlarını çeker, isgapp'i derler ve stack'i başlatır

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

## Yedekleme

```bash
sh backup.sh                          # ./backups/YYYY-AA-GG_HHMMSS/ altına alır
sh backup.sh -o /mnt/diskbak          # özel hedef dizin
```

Yedek içeriği:

- `db.dump` — PostgreSQL custom-format dump (şema + veri)
- `storage.tar.gz` — Storage dosyaları

### Cron ile otomatik yedekleme

```
0 2 * * * cd /path/to/self-host && sh backup.sh >> backups/backup.log 2>&1
```

### Geri yükleme

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

- **RLS PUBLİC (dev modu)**: tüm tablolar `USING (true)` policy'si ile herkese açık.
  Üretime geçmeden önce `auth.role() = 'authenticated'` tabanlı policy'ler uygulayın.
- **Storage bucket'ları public**: yukarıdaki storage policy'leri `public` rolüne açık.
- Bu pakette login/auth akışı YOKTUR; isgapp anon key ile çalışır.

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
