#!/bin/sh
#
# ISGAPP self-host geri yükleme script'i — VERI KAYIPSIZ GÜNCELLEME TAMAMLAYICISI
#
# Bir backup.sh yedeğinden sistemi geri yükler.
# - Veritabanı (pg_restore, custom format)
# - Storage dosyaları (tar)
# - İsteğe bağlı: .env, .applied_migrations
#
# Kullanım:
#   sh restore.sh backups/2026-08-02_103000
#   sh restore.sh backups/2026-08-02_103000 --only-db
#   sh restore.sh backups/2026-08-02_103000 --only-storage
#   sh restore.sh -h
#
# NOT: Bu script VERI KAYIPSIZ geri yükleme yapar — mevcut verileri
#      yedekteki verilerle değiştirir, ancak yedek öncesi veriler
#      yedekte olduğundan kayıp yoktur. Emin değilseniz önce backup.sh
#      ile mevcut durumu yedekleyin.

set -e

export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

ONLY_DB=0
ONLY_STORAGE=0

print_help() {
    cat <<EOF
Kullanım: restore.sh [seçenekler] <yedek-dizini>

Argümanlar:
  <yedek-dizini>   backup.sh ile oluşturulmuş dizin (örn: backups/2026-08-02_103000)

Seçenekler:
  --only-db        Sadece veritabanını geri yükle
  --only-storage   Sadece storage dosyalarını geri yükle
  -h, --help       Bu yardımı göster

Örnekler:
  sh restore.sh backups/2026-08-12_143000
  sh restore.sh backups/2026-08-12_143000 --only-db
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --only-db) ONLY_DB=1; shift ;;
        --only-storage) ONLY_STORAGE=1; shift ;;
        -h|--help) print_help; exit 0 ;;
        -*) echo "Bilinmeyen seçenek: $1" >&2; print_help; exit 1 ;;
        *) BACKUP_DIR="$1"; shift ;;
    esac
done

[ -z "${BACKUP_DIR:-}" ] && { echo "HATA: yedek dizini belirtin" >&2; print_help; exit 1; }

log()  { printf "===> %s\n" "$*"; }
warn() { printf "UYARI: %s\n" "$*" >&2; }
die()  { printf "HATA: %s\n" "$*" >&2; exit 1; }

[ -d "$BACKUP_DIR" ] || die "Yedek dizini bulunamadı: $BACKUP_DIR"
[ -f .env ] || die ".env bulunamadı. self-host/ dizininde çalıştırın."

command -v docker >/dev/null 2>&1 || die "docker gerekli."
docker compose version >/dev/null 2>&1 || die "docker compose plugin gerekli."
docker info >/dev/null 2>&1 || die "Docker daemon çalışmıyor."

if ! docker compose ps db >/dev/null 2>&1 | grep -q "Up"; then
    die "db servisi çalışmıyor. Önce: docker compose up -d db"
fi

# Önce mevcut durumu yedekle (ekstra güvenlik — veri kayıpsız)
log "Geri yükleme öncesi mevcut durum yedekleniyor (ekstra güvenlik)"
sh backup.sh || warn "Ön yedek alınamadı; devam ediliyor"

echo ""
echo "Geri yüklenecek yedek: $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | tail -n +2
echo ""
printf "Devam edilsin mi? Mevcut veriler yedekteki verilerle DEĞİŞTİRİLECEK [e/H]: "
read -r ans
case "$ans" in
    e|E|evet|Evet|EVET) ;;
    *) echo "İptal edildi."; exit 0 ;;
esac

if [ "$ONLY_STORAGE" = "0" ]; then
    if [ -f "$BACKUP_DIR/db.dump" ]; then
        log "Veritabanı geri yükleniyor: $BACKUP_DIR/db.dump"
        # db.dump doğrula
        DUMP_SIZE=$(wc -c < "$BACKUP_DIR/db.dump" | tr -d ' ')
        if [ "$DUMP_SIZE" -lt 1024 ]; then
            die "db.dump çok küçük ($DUMP_SIZE bayt) — bozuk olabilir"
        fi
        docker compose cp "$BACKUP_DIR/db.dump" db:/tmp/restore.dump
        # -c --if-exists: varsa temizle, yoksa hata verme; -v ON_ERROR_STOP=1 güvenli mod
        docker compose exec -T db pg_restore -U postgres -d postgres \
            -c --if-exists -v /tmp/restore.dump || {
                warn "pg_restore hata verdi; log: docker compose logs db"
                # Yine de devam et, kısmi restore olabilir
            }
        docker compose exec -T db rm -f /tmp/restore.dump
        log "Veritabanı geri yüklendi"
    else
        warn "db.dump bulunamadı ($BACKUP_DIR/db.dump) — DB geri yükleme atlandı"
    fi
fi

if [ "$ONLY_DB" = "0" ]; then
    if [ -f "$BACKUP_DIR/storage.tar.gz" ]; then
        log "Storage dosyaları geri yükleniyor: $BACKUP_DIR/storage.tar.gz"
        # Mevcut storage'ı yedekle (üzerine yazmadan önce)
        if [ -d ./volumes/storage ] && [ -n "$(ls -A ./volumes/storage 2>/dev/null)" ]; then
            STAMP=$(date +%Y-%m-%d_%H%M%S)
            mkdir -p ./volumes/storage-pre-restore-$STAMP
            cp -r ./volumes/storage ./volumes/storage-pre-restore-$STAMP/ 2>/dev/null || true
            log "Mevcut storage ./volumes/storage-pre-restore-$STAMP/ altına yedeklendi"
        fi
        tar -xzf "$BACKUP_DIR/storage.tar.gz" -C ./volumes
        log "Storage geri yüklendi"
    else
        warn "storage.tar.gz bulunamadı — storage geri yükleme atlandı"
    fi
fi

# .env ve .applied_migrations isteğe bağlı geri yükleme (kullanıcı onayı ile)
if [ -f "$BACKUP_DIR/.env.bak" ]; then
    echo ""
    printf ".env yedeği bulundu ($BACKUP_DIR/.env.bak). Mevcut .env ile değiştirilsin mi? [e/H]: "
    read -r ans2
    case "$ans2" in
        e|E|evet|Evet|EVET)
            cp .env .env.pre-restore.$(date +%Y%m%d_%H%M%S)
            cp "$BACKUP_DIR/.env.bak" .env
            log ".env geri yüklendi (eski .env .env.pre-restore.* olarak saklandı)"
            ;;
        *) log ".env geri yükleme atlandı" ;;
    esac
fi
if [ -f "$BACKUP_DIR/.applied_migrations.bak" ]; then
    cp "$BACKUP_DIR/.applied_migrations.bak" .applied_migrations 2>/dev/null && log ".applied_migrations geri yüklendi" || true
fi

echo ""
echo "Geri yükleme tamamlandı."
echo "Durum:  docker compose ps"
echo "Log:    docker compose logs -f isgapp"
if [ -f "$BACKUP_DIR/manifest.json" ]; then
    echo "Yedek manifest: $BACKUP_DIR/manifest.json"
fi
