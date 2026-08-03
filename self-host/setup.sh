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

log "isgapp imajı derleniyor"
docker compose build isgapp

log "Stack başlatılıyor"
docker compose up -d

# --- Migrasyon takip dosyası ----------------------------------------------
# init.sql tüm mevcut migrasyonları içerir; güncelleme script'i (update.sh)
# yalnızca bu dosyada OLMAYAN migrasyonları uygular.
if [ -d ../supabase/migrations ]; then
    : > .applied_migrations
    for mig in $(ls ../supabase/migrations/*.sql | sort); do
        name=$(basename "$mig")
        [ "$name" = "ALL_PENDING.sql" ] && continue
        echo "$name" >> .applied_migrations
    done
    log "Migrasyon durumu kaydedildi ($(wc -l < .applied_migrations) dosya uygulanmış sayıldı)"
fi

echo ""
echo "Kurulum tamamlandı. Erişim adresleri:"
echo "  isgapp (uygulama):  http://localhost:$(grep '^ISGAPP_HTTP_PORT=' .env | cut -d= -f2-)/giris"
echo "  Studio (dashboard): $public_url"
echo "  REST API:           ${public_url}/rest/v1"
echo ""
echo "Kullanıcı oluşturma (ilk giriş için zorunlu):"
echo "  node ../scripts/create-user.js --username kullanici --password SIFRE --ad \"Ad Soyad\" --rol admin"
echo "  (ya da: npm run create-user -- --username kullanici --password SIFRE --rol admin)"
echo ""
echo "Durumu izleme:  docker compose ps"
echo "Log izleme:     docker compose logs -f"
echo "Yedekleme:      sh backup.sh"
echo "Kapatma:        docker compose down"
echo ""
echo "NOT: .env içindeki DASHBOARD_USERNAME/PASSWORD ile Studio'ya giriş yapın."
