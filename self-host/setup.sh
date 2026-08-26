#!/bin/sh
#
# ISGAPP self-host paketi kurulum script'i.
#
# Ne yapar:
#   1. Docker + Compose plugin kontrolü (yoksa yükleme komutunu gösterir)
#   2. .env oluşturur (yoksa .env.example'dan kopyalar)
#   3. Tüm sırları üretir: JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY,
#      asimetrik key çifti, opak API key'ler, BACKUP_API_KEY
#   4. Docker imajlarını çeker ve stack'i ayağa kaldırır
#
# Kullanım:
#   sh setup.sh              # interaktif
#   sh setup.sh -y           # varsayılanlarla, onay sormadan
#
# Notlar:
#   - Veritabanı şeması ilk açılışta ./init.sql'den otomatik kurulur
#   - init.sql yalnızca BOŞ veritabanında çalışır
#   - Docker gerektirir (curl | sh kurulumu bu script'te yapılmaz;
#     https://docs.docker.com/engine/install/ adresine bakın)

set -e

# Windows 10/11 Git Bash: /app, /tmp gibi konteyner yollarını Windows yoluna çevirme.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

ASSUME_YES=0

print_help() {
    cat <<EOF
Kullanım: setup.sh [seçenekler]

Seçenekler:
  -y, --yes   Non-interaktif: varsayılanları kabul et, onay sorma
  -h, --help  Bu yardımı göster
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        -y|--yes) ASSUME_YES=1; shift ;;
        -h|--help) print_help; exit 0 ;;
        *) echo "Bilinmeyen seçenek: $1" >&2; print_help; exit 1 ;;
    esac
done

log()  { printf "===> %s\n" "$*"; }
warn() { printf "UYARI: %s\n" "$*" >&2; }
die()  { printf "HATA: %s\n" "$*" >&2; exit 1; }

# --- Ön koşullar -----------------------------------------------------------

command -v openssl >/dev/null 2>&1 || die "openssl gerekli (örn: apt install openssl)"
command -v docker >/dev/null 2>&1 || die "docker gerekli. Kurulum: https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1 || die "docker compose plugin gerekli."
docker info >/dev/null 2>&1 || die "Docker daemon çalışmıyor. Önce başlatın: sudo systemctl start docker"

# --- .env hazırlama --------------------------------------------------------

if [ ! -f .env ]; then
    if [ ! -f .env.example ]; then
        die ".env.example bulunamadı. Bu script'i self-host/ dizininde çalıştırın."
    fi
    log ".env oluşturuluyor (.env.example'dan)"
    cp .env.example .env
else
    log ".env zaten var, atlanıyor"
fi

# --- Sır üretimi -----------------------------------------------------------

log "Legacy sırlar ve JWT API key'leri üretiliyor"
sh utils/generate-keys.sh --update-env

log "Asimetrik key çifti ve opak API key'ler üretiliyor"
sh utils/add-new-auth-keys.sh --update-env

# BACKUP_API_KEY henüz yoksa üret (isgapp backup uç noktası için)
if grep -q '^BACKUP_API_KEY=your-backup-api-key' .env; then
    log "BACKUP_API_KEY üretiliyor"
    backup_api_key=$(openssl rand -hex 24)
    sed -i.old -e "s|^BACKUP_API_KEY=.*$|BACKUP_API_KEY=${backup_api_key}|" .env
    rm -f .env.old
else
    log "BACKUP_API_KEY zaten ayarlanmış, atlanıyor"
fi

# UPDATER_API_KEY henüz yoksa üret (isgapp-updater güncelleme uç noktası için)
if grep -q '^UPDATER_API_KEY=your-updater-api-key' .env; then
    log "UPDATER_API_KEY üretiliyor"
    updater_api_key=$(openssl rand -hex 24)
    sed -i.old -e "s|^UPDATER_API_KEY=.*$|UPDATER_API_KEY=${updater_api_key}|" .env
    rm -f .env.old
else
    log "UPDATER_API_KEY zaten ayarlanmış, atlanıyor"
fi

# --- URL'ler ---------------------------------------------------------------

# İnteraktif olmayan modda varsayılanları kullan
if [ "$ASSUME_YES" = "1" ]; then
    log "Non-interaktif mod: varsayılan URL'ler kullanılıyor (.env'den değiştirin)"
else
    echo ""
    echo "Ana URL'leri yapılandırın (varsayılan için Enter'a basın)."
    echo ""
    current_public=$(grep '^SUPABASE_PUBLIC_URL=' .env | cut -d= -f2- | tr -d '\r')
    current_site=$(grep '^SITE_URL=' .env | cut -d= -f2- | tr -d '\r')
    [ -z "$current_public" ] && current_public="http://localhost:8000"
    [ -z "$current_site" ] && current_site="http://localhost:3000"

    printf "SUPABASE_PUBLIC_URL (Studio + API'ler) [%s]: " "$current_public"
    read -r public_url; [ -z "$public_url" ] && public_url="$current_public"
    printf "SITE_URL (isgapp / Auth redirect) [%s]: " "$current_site"
    read -r site_url; [ -z "$site_url" ] && site_url="$current_site"

    sed -i.old \
        -e "s|^SUPABASE_PUBLIC_URL=.*$|SUPABASE_PUBLIC_URL=${public_url}|" \
        -e "s|^API_EXTERNAL_URL=.*$|API_EXTERNAL_URL=${public_url}/auth/v1|" \
        -e "s|^SITE_URL=.*$|SITE_URL=${site_url}|" \
        .env
    rm -f .env.old
fi

# --- Stack'i ayağa kaldır --------------------------------------------------

log "Docker imajları çekiliyor (ilk seferde uzun sürebilir)"
docker compose --progress quiet pull || warn "docker compose pull başarısız; 'docker compose pull' ile tekrar deneyin."

log "isgapp ve isgapp-updater imajları derleniyor"
docker compose build isgapp
docker compose build isgapp-updater

log "Stack başlatılıyor"
docker compose up -d

# isgapp-updater profil ile çalışır; açıkça başlatılır.
# (Güncelleme sırasında `docker compose up -d` bu servise dokunmaz.)
log "isgapp-updater başlatılıyor"
docker compose --profile updater up -d isgapp-updater

# --- Storage setup ---------------------------------------------------------
# storage.buckets / storage.objects tablolarını storage-api servisi ayağa
# kalkınca oluşturur. isgapp bucket + policy'leri (storage-setup.sql) bu
# tablolar hazır olduktan SONRA uygulanır (idempotent).
log "Storage bucket ve policy'leri uygulanıyor (storage hazır olana kadar bekleniyor)"
storage_ready=0
for i in $(seq 1 90); do
    if docker compose exec -T db psql -U postgres -d postgres -Atc \
        "SELECT to_regclass('storage.buckets') IS NOT NULL AND to_regclass('storage.objects') IS NOT NULL" 2>/dev/null | grep -q '^t$'; then
        storage_ready=1
        break
    fi
    sleep 2
done
if [ "$storage_ready" = "1" ]; then
    docker compose exec -T db psql -U postgres -d postgres \
        -v ON_ERROR_STOP=1 < storage-setup.sql \
        && log "Storage bucket ve policy'leri uygulandı" \
        || warn "storage-setup.sql uygulanırken hata oluştu; log: docker compose logs db"
else
    warn "storage.buckets/storage.objects zamanında hazır olmadı; storage-setup.sql atlandı. Tekrar için: sh update.sh"
fi

# --- Referans veri seed ----------------------------------------------------
# Sabit/referans verileri yükler: myk_egitim_listesi (MYK kataloğu), ayarlar
# (modül açma/kapama, uyarı günleri, menü sırası, hat listesi).
# Idempotent: tekrar çalıştırılması güvenlidir.
log "Referans veri seed uygulanıyor (myk_egitim_listesi, ayarlar)"
docker compose exec -T db psql -U postgres -d postgres \
    -v ON_ERROR_STOP=1 < seed-reference-data.sql \
    && log "Referans veri seed uygulandı" \
    || warn "seed-reference-data.sql uygulanırken hata oluştu; log: docker compose logs db"

# --- Admin kullanıcı -------------------------------------------------------
# İlk kurulumda varsayılan admin kullanıcıyı otomatik oluşturur (yonetici rolü).
# Kullanıcı zaten varsa atlar; .env içindeki ADMIN_USERNAME/ADMIN_PASSWORD ile
# değiştirilebilir. Şifre 8 karakterden kısa ise create-user.js uyarır.
ADMIN_USERNAME=$(grep '^ADMIN_USERNAME=' .env | cut -d= -f2- | tr -d '\r')
ADMIN_PASSWORD=$(grep '^ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '\r')
[ -z "$ADMIN_USERNAME" ] && ADMIN_USERNAME="yonetici"
[ -z "$ADMIN_PASSWORD" ] && ADMIN_PASSWORD="yonetici54"

log "Admin kullanıcı kontrol ediliyor ($ADMIN_USERNAME)"
admin_exists=$(docker compose exec -T db psql -U postgres -d postgres -Atc \
    "SELECT 1 FROM app_users WHERE username = '${ADMIN_USERNAME}'" 2>/dev/null || true)
if [ "$admin_exists" = "1" ]; then
    log "Admin kullanıcı '$ADMIN_USERNAME' zaten var, atlanıyor"
else
    log "Admin kullanıcı oluşturuluyor: '$ADMIN_USERNAME' (rol: admin)"
    docker compose cp ../scripts/create-user.js isgapp:/app/create-user.js
    if docker compose exec -T isgapp node /app/create-user.js \
        --username "$ADMIN_USERNAME" --password "$ADMIN_PASSWORD" \
        --ad "Yönetici" --rol admin; then
        log "Admin kullanıcı oluşturuldu"
    else
        warn "Admin kullanıcı oluşturulamadı; elle: sh create-user.sh --username $ADMIN_USERNAME --password ... --rol admin"
    fi
fi

# --- Migrasyon takip dosyası ----------------------------------------------
# init.sql tüm mevcut migrasyonları içerir; güncelleme script'i (update.sh)
# yalnızca bu dosyada OLMAYAN migrasyonları uygular.
if [ -d ../supabase/migrations ]; then
    : > .applied_migrations
    for mig in ../supabase/migrations/*.sql; do
        [ -e "$mig" ] || continue
        name=$(basename "$mig")
        [ "$name" = "ALL_PENDING.sql" ] && continue
        echo "$name" >> .applied_migrations
    done
    # Deterministik sıra için sırala
    sort -o .applied_migrations .applied_migrations 2>/dev/null || true
    log "Migrasyon durumu kaydedildi ($(wc -l < .applied_migrations) dosya uygulanmış sayıldı)"
fi

echo ""
echo "Kurulum tamamlandı. Erişim adresleri:"
echo "  isgapp (uygulama):  http://localhost:$(grep '^ISGAPP_HTTP_PORT=' .env | cut -d= -f2- | tr -d '\r')/giris"
echo "  Studio (dashboard): $public_url"
echo "  REST API:           ${public_url}/rest/v1"
echo ""
echo "Kullanıcı girişi (kurulumda otomatik oluşturuldu):"
echo "  http://localhost:$(grep '^ISGAPP_HTTP_PORT=' .env | cut -d= -f2- | tr -d '\r')/giris"
echo "  Kullanıcı adı: $ADMIN_USERNAME   Şifre: (ADMIN_PASSWORD .env içinde)"
echo ""
echo "Yeni kullanıcı eklemek için:"
echo "  node ../scripts/create-user.js --username kullanici --password SIFRE --ad \"Ad Soyad\" --rol admin"
echo "  (ya da: npm run create-user -- --username kullanici --password SIFRE --rol admin)"
echo ""
echo "Durumu izleme:  docker compose ps"
echo "Log izleme:     docker compose logs -f"
echo "Yedekleme:      sh backup.sh"
echo "Kapatma:        docker compose down"
echo ""
echo "NOT: .env içindeki DASHBOARD_USERNAME/PASSWORD ile Studio'ya giriş yapın."
