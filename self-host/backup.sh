#!/bin/sh
#
# ISGAPP self-host yedekleme script'i.
#
# Yedeklenenler:
#   1. PostgreSQL veritabanı (pg_dump, custom format)
#   2. Storage dosyaları (./volumes/storage)
#
# Kullanım:
#   sh backup.sh                # yedek al
#   sh backup.sh -o ./backups   # hedef dizin belirt (varsayılan: ./backups)
#   sh backup.sh -h             # yardım
#
# Yedekler ISO tarih-stamplı alt dizinde tutulur:
#   backups/2026-08-02_103000/db.dump
#   backups/2026-08-02_103000/storage.tar.gz
#
# Geri yükleme:
#   # 1. Stack'i durdurun:  docker compose down
#   # 2. DB'yi geri yükleyin:
#   #      docker compose run --rm db pg_restore -U postgres -d postgres \
#   #        -c --if-exists < backups/2026-08-02_103000/db.dump
#   #    NOT: Şema zaten kuruluysa yalnızca VERİ yedeğini de kullanabilirsiniz:
#   #      docker compose run --rm db pg_dump -U postgres -d postgres \
#   #        --data-only ... (bunun yerine custom dump'ı geri yüklemek daha güvenlidir)
#   # 3. Storage'ı geri yükleyin:
#   #      tar -xzf backups/2026-08-02_103000/storage.tar.gz -C ./volumes
#   # 4. Stack'i başlatın:  docker compose up -d

set -e

BACKUP_DIR="backups"
OUT_DIR=""

print_help() {
    cat <<EOF
Kullanım: backup.sh [seçenekler]

Seçenekler:
  -o, --output <dizin>  Yedek hedef dizini (varsayılan: ./backups)
  -h, --help            Bu yardımı göster
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        -o|--output) OUT_DIR="$2"; shift 2 ;;
        -h|--help) print_help; exit 0 ;;
        *) echo "Bilinmeyen seçenek: $1" >&2; print_help; exit 1 ;;
    esac
done

log()  { printf "===> %s\n" "$*"; }
die()  { printf "HATA: %s\n" "$*" >&2; exit 1; }

[ -n "$OUT_DIR" ] && BACKUP_DIR="$OUT_DIR"

# Docker kontrol
command -v docker >/dev/null 2>&1 || die "docker gerekli."
docker compose version >/dev/null 2>&1 || die "docker compose plugin gerekli."
docker info >/dev/null 2>&1 || die "Docker daemon çalışmıyor."

# db servisi ayakta mı?
if ! docker compose ps db >/dev/null 2>&1 | grep -q "Up"; then
    die "db servisi çalışmıyor. Önce: docker compose up -d db"
fi

# .env'den şifreyi oku
POSTGRES_PASSWORD=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2- | tr -d '\r')
if [ -z "$POSTGRES_PASSWORD" ]; then
    die "POSTGRES_PASSWORD .env içinde bulunamadı."
fi

STAMP=$(date +%Y-%m-%d_%H%M%S)
DEST="$BACKUP_DIR/$STAMP"
mkdir -p "$DEST"

log "Veritabanı yedekleniyor (custom format)"
docker compose exec -T db pg_dump \
    -U postgres -d postgres \
    -Fc \
    -f /tmp/isgapp_db.dump
docker compose cp db:/tmp/isgapp_db.dump "$DEST/db.dump"
docker compose exec -T db rm -f /tmp/isgapp_db.dump
log "DB yedeği: $DEST/db.dump"

if [ -d ./volumes/storage ] && [ -n "$(ls -A ./volumes/storage 2>/dev/null)" ]; then
    log "Storage dosyaları yedekleniyor"
    tar -czf "$DEST/storage.tar.gz" -C ./volumes ./storage
    log "Storage yedeği: $DEST/storage.tar.gz"
else
    warn "./volumes/storage boş veya yok; storage yedeği atlandı"
fi

SIZE=$(du -sh "$DEST" | cut -f1)
echo ""
echo "Yedekleme tamamlandı: $DEST ($SIZE)"
echo "Yedek dosyaları:"
ls -lh "$DEST" | tail -n +2
echo ""
echo "Otomatik yedekleme (cron) örneği — her gece 02:00'de:"
echo "  0 2 * * * cd /path/to/self-host && sh backup.sh >> backups/backup.log 2>&1"
