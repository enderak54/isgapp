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

log "isgapp imajı yeniden derleniyor"
docker compose build isgapp

# --- 5. Stack güncelleme ---------------------------------------------------

log "Stack güncelleniyor"
docker compose up -d

echo ""
echo "Güncelleme tamamlandı."
echo "Durum:  docker compose ps"
echo "Log:    docker compose logs -f isgapp"
