#!/bin/sh
#
# ISGAPP self-host güncelleme script'i.
#
# Yapılanlar (sırayla):
#   1. (varsayılan) Yedek alır: sh backup.sh
#   2. Repo'yu günceller:      git pull --ff-only (repo kökünde)
#   3. Yeni migrasyonları uygular (supabase/migrations/*.sql —
#      yalnızca .applied_migrations dosyasında OLMAYANLAR, sırayla)
#   4. isgapp imajını yeniden derler
#   5. Stack'i günceller:      docker compose up -d
#
# Migrasyon takibi:
#   - setup.sh kurulumda init.sql'in mevcut tüm migrasyonları kapsadığını
#     kabul eder ve hepsini .applied_migrations'a yazar.
#   - Bu script yalnızca listede OLMAYAN migrasyonları uygular ve kaydeder.
#   - .applied_migrations YOKSA (eski kurulum) mevcut migrasyonların
#     tamamı "uygulanmış" sayılır ve yalnızca YENİ eklenen dosyalar uygulanır.
#     NOT: Kurulumdaki init.sql'den daha eski migrasyonlar bu kurulumda
#     eksikse manuel uygulanmalıdır (psql -f).
#
# Kullanım:
#   sh update.sh                # yedek al + güncelle
#   sh update.sh -n             # yedek almadan güncelle
#   sh update.sh -h             # yardım
#
# Örnek:
#   cd /opt/isgapp/self-host && sh update.sh

set -e

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"
REPO_ROOT=$(dirname "$SCRIPT_DIR")

MIG_DIR="$REPO_ROOT/supabase/migrations"
STATE_FILE=".applied_migrations"
DO_BACKUP=1

print_help() {
    cat <<EOF
Kullanım: update.sh [seçenekler]

Seçenekler:
  -n, --no-backup   Yedek almadan güncelle (varsayılan: güncellemeden önce yedek alınır)
  -h, --help        Bu yardımı göster
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        -n|--no-backup) DO_BACKUP=0; shift ;;
        -h|--help) print_help; exit 0 ;;
        *) echo "Bilinmeyen seçenek: $1" >&2; print_help; exit 1 ;;
    esac
done

log()  { printf "===> %s\n" "$*"; }
warn() { printf "UYARI: %s\n" "$*" >&2; }
die()  { printf "HATA: %s\n" "$*" >&2; exit 1; }

# --- Ön koşullar -----------------------------------------------------------

command -v docker >/dev/null 2>&1 || die "docker gerekli."
command -v git   >/dev/null 2>&1 || die "git gerekli."
docker compose version >/dev/null 2>&1 || die "docker compose plugin gerekli."
docker info >/dev/null 2>&1 || die "Docker daemon çalışmıyor."
[ -f .env ] || die ".env bulunamadı. Önce kurulumu çalıştırın: sh setup.sh"

# UPDATER_API_KEY henüz yoksa üret (isgapp-updater güncelleme uç noktası için)
if grep -q '^UPDATER_API_KEY=your-updater-api-key' .env || ! grep -q '^UPDATER_API_KEY=' .env; then
    log "UPDATER_API_KEY üretiliyor"
    updater_api_key=$(openssl rand -hex 24)
    sed -i.old -e "s|^UPDATER_API_KEY=.*$|UPDATER_API_KEY=${updater_api_key}|" .env || true
    if ! grep -q '^UPDATER_API_KEY=' .env; then
        printf 'UPDATER_API_KEY=%s\n' "$updater_api_key" >> .env
    fi
    rm -f .env.old
fi

if ! docker compose ps db >/dev/null 2>&1 | grep -q "Up"; then
    die "db servisi çalışmıyor. Önce: docker compose up -d db"
fi

# --- 1. Yedek --------------------------------------------------------------

if [ "$DO_BACKUP" = "1" ]; then
    log "Güncelleme öncesi yedek alınıyor"
    sh backup.sh
else
    warn "Yedek alınmadan güncelleniyor (-n)"
fi

# --- 2. Repo güncelleme ----------------------------------------------------

if [ ! -d "$REPO_ROOT/.git" ]; then
    die "Git deposu bulunamadı: $REPO_ROOT (self-host dizininin üst klasöründe repo olmalı)"
fi
log "Repo güncelleniyor: $REPO_ROOT"
git -C "$REPO_ROOT" pull --ff-only

# --- 3. Yeni migrasyonlar --------------------------------------------------

if [ -d "$MIG_DIR" ]; then
    if [ ! -f "$STATE_FILE" ]; then
        warn ".applied_migrations yok; mevcut migrasyonlar uygulanmış sayılıyor."
        warn "Kurulumdaki init.sql'den daha yeni olan migrasyonlar listede olmadığından uygulanır."
    fi

    applied=0
    for mig in $(ls "$MIG_DIR"/*.sql | sort); do
        name=$(basename "$mig")
        case "$name" in
            ALL_PENDING.sql) continue ;;  # yardımcı dosya, migrasyon değil
        esac
        if [ -f "$STATE_FILE" ] && grep -qx "$name" "$STATE_FILE"; then
            continue  # zaten uygulanmış
        fi
        log "Migrasyon uygulanıyor: $name"
        docker compose cp "$mig" db:/tmp/isgapp_mig.sql
        docker compose exec -T db psql -U postgres -d postgres \
            -v ON_ERROR_STOP=1 -f /tmp/isgapp_mig.sql
        docker compose exec -T db rm -f /tmp/isgapp_mig.sql
        echo "$name" >> "$STATE_FILE"
        applied=$((applied + 1))
    done
    log "Uygulanan yeni migrasyon sayısı: $applied"
else
    log "Migrasyon dizini yok ($MIG_DIR); schema güncellemesi atlandı"
fi

# --- 4. isgapp derleme -----------------------------------------------------

log "isgapp ve isgapp-updater imajları yeniden derleniyor"
docker compose build isgapp
# updater kod değişiklikleri de imaja işlesin (konteyner profilde olduğundan
# `docker compose up -d` buna dokunmaz; yeni imaj bir sonraki başlatmada kullanılır)
docker compose build isgapp-updater || warn "isgapp-updater build'i başarısız; elle: docker compose --profile updater up -d --build isgapp-updater"

# --- 5. Stack güncelleme ---------------------------------------------------

log "Stack güncelleniyor"
docker compose up -d

# --- 6. Storage setup (idempotent) -----------------------------------------
# Bucket + objects policy'lerini, storage tabloları hazır olduktan sonra
# uygula. Kurulum yeni ise tablolar storage-api tarafından bu an oluşur.
log "Storage bucket ve policy'leri güncelleniyor (storage hazır olana kadar bekleniyor)"
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
        && log "Storage bucket ve policy'leri güncellendi" \
        || warn "storage-setup.sql uygulanırken hata oluştu; log: docker compose logs db"
else
    warn "storage.buckets/storage.objects zamanında hazır olmadı; storage-setup.sql atlandı."
fi

# --- 7. Referans veri seed (idempotent) ------------------------------------
# Sabit/referans verileri yükler: myk_egitim_listesi, ayarlar.
# Zaten var olan anahtarları atlar; yeni eklenenleri ekler.
# Bu sayede güncellemelerde referans veriler de güncel kalır.
log "Referans veri seed uygulanıyor (myk_egitim_listesi, ayarlar)"
docker compose exec -T db psql -U postgres -d postgres \
    -v ON_ERROR_STOP=1 < seed-reference-data.sql \
    && log "Referans veri seed uygulandı" \
    || warn "seed-reference-data.sql uygulanırken hata oluştu; log: docker compose logs db"

# --- 8. Admin kullanıcı (idempotent) ----------------------------------------
# Kurulumda/güncellemede varsayılan admin kullanıcıyı yoksa oluşturur.
# .env içindeki ADMIN_USERNAME/ADMIN_PASSWORD ile değiştirilebilir.
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

echo ""
echo "Güncelleme tamamlandı."
echo "Durum:  docker compose ps"
echo "Log:    docker compose logs -f isgapp"
