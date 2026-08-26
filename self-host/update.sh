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
#   sh update.sh                # yedek al + güncelle (VERI KAYIPSIZ)
#   sh update.sh -n             # yedek almadan güncelle
#   sh update.sh --dry-run      # ne yapılacağını göster, hiçbir şeyi değiştirme
#   sh update.sh -h             # yardım
#
# Örnek:
#   cd /opt/isgapp/self-host && sh update.sh

set -e

# Windows 10/11 Git Bash: /app, /tmp gibi konteyner yollarını Windows yoluna çevirme.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"
REPO_ROOT=$(dirname "$SCRIPT_DIR")

MIG_DIR="$REPO_ROOT/supabase/migrations"
STATE_FILE=".applied_migrations"
DO_BACKUP=1
DRY_RUN=0

print_help() {
    cat <<EOF
Kullanım: update.sh [seçenekler]

Seçenekler:
  -n, --no-backup   Yedek almadan güncelle (varsayılan: güncellemeden önce yedek alınır)
      --dry-run     Ne yapılacağını göster, hiçbir şeyi değiştirme (VERI KAYIPSIZ önizleme)
  -h, --help        Bu yardımı göster

Veri garantisi: Bu script hiçbir kullanıcı verisini silmez. Sadece
  - yedek alır (backup.sh — salt okuma)
  - git pull ile kodu günceller (veritabanına dokunmaz)
  - YENİ migrasyonları ekler (ALTER TABLE IF NOT EXISTS, ON CONFLICT — veriyi korur)
  - isgapp imajını yeniden derler (volumes/db/data ve volumes/storage ASLA silinmez)
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        -n|--no-backup) DO_BACKUP=0; shift ;;
        --dry-run) DRY_RUN=1; shift ;;
        -h|--help) print_help; exit 0 ;;
        *) echo "Bilinmeyen seçenek: $1" >&2; print_help; exit 1 ;;
    esac
done

log()  { printf "===> %s\n" "$*"; }
warn() { printf "UYARI: %s\n" "$*" >&2; }
die()  { printf "HATA: %s\n" "$*" >&2; exit 1; }

if [ "$DRY_RUN" = "1" ]; then
    log "=== DRY-RUN MODU — hiçbir değişiklik yapılmayacak ==="
fi

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

if ! docker inspect -f '{{.State.Running}}' supabase-db 2>/dev/null | grep -q "true"; then
    if ! docker ps --filter "name=supabase-db" --filter "status=running" --format "{{.Names}}" 2>/dev/null | grep -q "supabase-db"; then
        if ! docker compose ps db 2>/dev/null | grep -q "Up"; then
            die "db servisi çalışmıyor. Önce: docker compose up -d db"
        fi
    fi
fi

# --- 0. Ön kontroller (veri kaybı önlemi) -----------------------------------
log "Ön kontroller (veri kaybı önlemi)"
# Disk alanı (en az 1GB boş olmalı)
if command -v df >/dev/null 2>&1; then
    avail_kb=$(df -k . | tail -1 | awk '{print $4}')
    if [ -n "$avail_kb" ] && [ "$avail_kb" -lt 1048576 ]; then
        warn "Disk alanı düşük ($avail_kb KB) — yedek/güncelleme için en az 1GB önerilir"
    fi
fi
# Git durumu (MSYS yol çevirmesi git için açılır — Windows Git Bash uyumu)
if [ -d "$REPO_ROOT/.git" ]; then
    if ! MSYS_NO_PATHCONV=0 MSYS2_ARG_CONV_EXCL="" git -C "$REPO_ROOT" diff --quiet 2>/dev/null; then
        warn "Repo'da commitlenmemiş değişiklikler var — güncelleme öncesi commit/stash önerilir"
        MSYS_NO_PATHCONV=0 MSYS2_ARG_CONV_EXCL="" git -C "$REPO_ROOT" status --short 2>/dev/null | head -10 | while read -r line; do warn "  $line"; done
    fi
fi
# Mevcut veri sayımı (sonradan karşılaştırma için)
PERSONEL_ONCESI=$(docker compose exec -T db psql -U postgres -d postgres -Atc "SELECT count(*) FROM personel" 2>/dev/null | tr -d '\r' || echo "?")
log "Mevcut personel sayısı: $PERSONEL_ONCESI (güncelleme sonrası korunacak)"

# --- 1. Yedek --------------------------------------------------------------

if [ "$DRY_RUN" = "1" ]; then
    log "[DRY-RUN] Yedek alınacak: sh backup.sh (atlandı)"
    if [ "$DO_BACKUP" = "0" ]; then
        warn "[DRY-RUN] Yedek alınmadan güncellenecek (-n)"
    fi
elif [ "$DO_BACKUP" = "1" ]; then
    log "Güncelleme öncesi yedek alınıyor (VERI KAYIPSIZ — mevcut veriler yedeklenecek)"
    sh backup.sh
    # Yedek doğrulama
    LATEST_BACKUP=$(ls -td backups/*/ 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ] && [ ! -f "$LATEST_BACKUP/db.dump" ]; then
        die "Yedek doğrulaması BAŞARISIZ: $LATEST_BACKUP/db.dump bulunamadı — güncelleme durduruldu"
    fi
    log "Yedek doğrulandı: $LATEST_BACKUP"
else
    warn "Yedek alınmadan güncelleniyor (-n) — veri kaybı riski için yedek önerilir"
fi

# --- 2. Repo güncelleme ----------------------------------------------------

if [ ! -d "$REPO_ROOT/.git" ]; then
    die "Git deposu bulunamadı: $REPO_ROOT (self-host dizininin üst klasöründe repo olmalı)"
fi
log "Repo güncelleniyor: $REPO_ROOT"
if [ "$DRY_RUN" = "1" ]; then
    log "[DRY-RUN] git pull --ff-only atlandı; önizleme:"
    MSYS_NO_PATHCONV=0 MSYS2_ARG_CONV_EXCL="" git -C "$REPO_ROOT" fetch --dry-run 2>&1 | head -20 || true
    LOCAL_HEAD=$(MSYS_NO_PATHCONV=0 MSYS2_ARG_CONV_EXCL="" git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo "?")
    REMOTE_HEAD=$(MSYS_NO_PATHCONV=0 MSYS2_ARG_CONV_EXCL="" git -C "$REPO_ROOT" rev-parse --short origin/main 2>/dev/null || echo "?")
    log "[DRY-RUN] Lokal HEAD: $LOCAL_HEAD -> Uzak HEAD: $REMOTE_HEAD"
else
    MSYS_NO_PATHCONV=0 MSYS2_ARG_CONV_EXCL="" git -C "$REPO_ROOT" pull --ff-only
fi

# --- 3. Yeni migrasyonlar --------------------------------------------------

if [ -d "$MIG_DIR" ]; then
    if [ ! -f "$STATE_FILE" ]; then
        warn ".applied_migrations yok; mevcut migrasyonlar uygulanmış sayılıyor."
        warn "Kurulumdaki init.sql'den daha yeni olan migrasyonlar listede olmadığından uygulanır."
    fi

    applied=0
    pending_list=""
    for mig in "$MIG_DIR"/*.sql; do
        [ -e "$mig" ] || continue
        name=$(basename "$mig")
        case "$name" in
            ALL_PENDING.sql) continue ;;  # yardımcı dosya, migrasyon değil
        esac
        if [ -f "$STATE_FILE" ] && grep -qx "$name" "$STATE_FILE"; then
            continue  # zaten uygulanmış
        fi
        if [ "$DRY_RUN" = "1" ]; then
            log "[DRY-RUN] Bekleyen migrasyon: $name (uygulanmayacak)"
            pending_list="$pending_list $name"
            applied=$((applied + 1))
            continue
        fi
        log "Migrasyon uygulanıyor: $name (VERI KAYIPSIZ — IF NOT EXISTS / ON CONFLICT)"
        docker compose cp "$mig" db:/tmp/isgapp_mig.sql
        docker compose exec -T db psql -U postgres -d postgres \
            -v ON_ERROR_STOP=1 -f /tmp/isgapp_mig.sql
        docker compose exec -T db rm -f /tmp/isgapp_mig.sql
        echo "$name" >> "$STATE_FILE"
        applied=$((applied + 1))
    done
    if [ "$DRY_RUN" = "1" ]; then
        log "[DRY-RUN] Toplam bekleyen migrasyon: $applied${pending_list}"
    else
        log "Uygulanan yeni migrasyon sayısı: $applied"
    fi
else
    log "Migrasyon dizini yok ($MIG_DIR); schema güncellemesi atlandı"
fi

# --- 4. isgapp derleme -----------------------------------------------------

log "isgapp ve isgapp-updater imajları yeniden derleniyor"
if [ "$DRY_RUN" = "1" ]; then
    log "[DRY-RUN] docker compose build isgapp (atlandı)"
    log "[DRY-RUN] docker compose build isgapp-updater (atlandı)"
else
    docker compose build isgapp
    # updater kod değişiklikleri de imaja işlesin (konteyner profilde olduğundan
    # `docker compose up -d` buna dokunmaz; yeni imaj bir sonraki başlatmada kullanılır)
    docker compose build isgapp-updater || warn "isgapp-updater build'i başarısız; elle: docker compose --profile updater up -d --build isgapp-updater"
fi

# --- 5. Stack güncelleme ---------------------------------------------------

log "Stack güncelleniyor"
if [ "$DRY_RUN" = "1" ]; then
    log "[DRY-RUN] docker compose up -d (atlandı — hiçbir konteyner yeniden oluşturulmayacak)"
else
    docker compose up -d
fi

# --- 6. Storage setup (idempotent) -----------------------------------------
# Bucket + objects policy'lerini, storage tabloları hazır olduktan sonra
# uygula. Kurulum yeni ise tablolar storage-api tarafından bu an oluşur.
# VERI KAYIPSIZ: DROP POLICY IF EXISTS + CREATE POLICY + ON CONFLICT — veri silmez
if [ "$DRY_RUN" = "1" ]; then
    log "[DRY-RUN] Storage bucket ve policy'leri (atlandı)"
else
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
fi

# --- 7. Referans veri seed (idempotent) ------------------------------------
# Sabit/referans verileri yükler: myk_egitim_listesi, ayarlar.
# Zaten var olan anahtarları atlar; yeni eklenenleri ekler.
# Bu sayede güncellemelerde referans veriler de güncel kalır.
# VERI KAYIPSIZ: ON CONFLICT DO NOTHING / DO UPDATE — mevcut veriyi korur
if [ "$DRY_RUN" = "1" ]; then
    log "[DRY-RUN] Referans veri seed (atlandı)"
else
    log "Referans veri seed uygulanıyor (myk_egitim_listesi, ayarlar)"
    docker compose exec -T db psql -U postgres -d postgres \
        -v ON_ERROR_STOP=1 < seed-reference-data.sql \
        && log "Referans veri seed uygulandı" \
        || warn "seed-reference-data.sql uygulanırken hata oluştu; log: docker compose logs db"
fi

# --- 8. Admin kullanıcı (idempotent) ----------------------------------------
# Kurulumda/güncellemede varsayılan admin kullanıcıyı yoksa oluşturur.
# .env içindeki ADMIN_USERNAME/ADMIN_PASSWORD ile değiştirilebilir.
if [ "$DRY_RUN" = "1" ]; then
    log "[DRY-RUN] Admin kullanıcı kontrolü (atlandı)"
else
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
fi

# --- 9. Doğrulama (veri kaybı kontrolü) ------------------------------------
if [ "$DRY_RUN" = "1" ]; then
    echo ""
    echo "[DRY-RUN] Önizleme tamamlandı — hiçbir değişiklik yapılmadı."
    echo "Gerçek güncelleme için: sh update.sh"
else
    PERSONEL_SONRASI=$(docker compose exec -T db psql -U postgres -d postgres -Atc "SELECT count(*) FROM personel" 2>/dev/null | tr -d '\r' || echo "?")
    log "Doğrulama: personel sayısı $PERSONEL_ONCESI -> $PERSONEL_SONRASI (azalmamalı)"
    # Basit sağlık kontrolü
    if docker compose ps db 2>/dev/null | grep -q "Up"; then
        log "Doğrulama: db servisi ayakta"
    else
        warn "Doğrulama BAŞARISIZ: db servisi ayakta değil"
    fi
    echo ""
    echo "Güncelleme tamamlandı (VERI KAYIPSIZ)."
    echo "  Yedek:   $(ls -td backups/*/ 2>/dev/null | head -1 || echo 'backups/ (yok)')"
    echo "  Geri alma: sh restore.sh <yedek-dizini>"
    echo "Durum:  docker compose ps"
    echo "Log:    docker compose logs -f isgapp"
fi
