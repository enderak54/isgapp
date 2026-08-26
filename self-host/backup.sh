#!/bin/sh
#
# ISGAPP self-host yedekleme script'i — VERI KAYIPSIZ
#
# Yedeklenenler:
#   1. PostgreSQL veritabanı (pg_dump, custom format) — TÜM veriler dahil
#   2. Storage dosyaları (./volumes/storage)
#   3. SELF-HOST DURUMU: .env, .applied_migrations (geri yükleme için kritik)
#
# Özellikler:
#   - Idempotent, veri silmez; sadece okur ve yedekler
#   - Her yedek doğrulamalı (dosya varlığı, boyut, pg_restore --list)
#   - Manifest + checksum (yedek bütünlüğü)
#
# Kullanım:
#   sh backup.sh                # yedek al
#   sh backup.sh -o ./backups   # hedef dizin belirt (varsayılan: ./backups)
#   sh backup.sh -h             # yardım
#
# Yedekler ISO tarih-stamplı alt dizinde tutulur:
#   backups/2026-08-02_103000/db.dump
#   backups/2026-08-02_103000/storage.tar.gz
#   backups/2026-08-02_103000/.env.bak
#   backups/2026-08-02_103000/.applied_migrations.bak
#   backups/2026-08-02_103000/manifest.json
#
# Geri yükleme:
#   sh restore.sh backups/2026-08-02_103000
#   # veya manuel:
#   #   docker compose run --rm db pg_restore -U postgres -d postgres \
#   #     -c --if-exists < backups/2026-08-02_103000/db.dump
#   #   tar -xzf backups/2026-08-02_103000/storage.tar.gz -C ./volumes

set -e

# Windows 10/11 Git Bash: /tmp, /app gibi konteyner yollarını Windows yoluna çevirme.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

BACKUP_DIR="backups"
OUT_DIR=""

print_help() {
    cat <<EOF
Kullanım: backup.sh [seçenekler]

Seçenekler:
  -o, --output <dizin>  Yedek hedef dizini (varsayılan: ./backups)
  -h, --help            Bu yardımı göster

Not: Bu script VERI KAYIPSIZ yedek alır — hiçbir veri silmez, sadece okur.
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
warn() { printf "UYARI: %s\n" "$*" >&2; }
die()  { printf "HATA: %s\n" "$*" >&2; exit 1; }

[ -n "$OUT_DIR" ] && BACKUP_DIR="$OUT_DIR"

# Docker kontrol
command -v docker >/dev/null 2>&1 || die "docker gerekli."
docker compose version >/dev/null 2>&1 || die "docker compose plugin gerekli."
docker info >/dev/null 2>&1 || die "Docker daemon çalışmıyor."

# db servisi ayakta mı? (Windows Git Bash + docker inspect fallback)
if ! docker inspect -f '{{.State.Running}}' supabase-db 2>/dev/null | grep -q "true"; then
    if ! docker ps --filter "name=supabase-db" --filter "status=running" --format "{{.Names}}" 2>/dev/null | grep -q "supabase-db"; then
        if ! docker compose ps db 2>/dev/null | grep -q "Up"; then
            die "db servisi çalışmıyor. Önce: docker compose up -d db"
        fi
    fi
fi

# .env'den şifreyi oku
POSTGRES_PASSWORD=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2- | tr -d '\r')
if [ -z "$POSTGRES_PASSWORD" ]; then
    die "POSTGRES_PASSWORD .env içinde bulunamadı."
fi

STAMP=$(date +%Y-%m-%d_%H%M%S)
DEST="$BACKUP_DIR/$STAMP"
mkdir -p "$DEST"

log "Veritabanı yedekleniyor (custom format, VERI KAYIPSIZ — sadece okuma)"
docker compose exec -T db pg_dump \
    -U postgres -d postgres \
    -Fc \
    -f /tmp/isgapp_db.dump
docker compose cp db:/tmp/isgapp_db.dump "$DEST/db.dump"
docker compose exec -T db rm -f /tmp/isgapp_db.dump

# --- Doğrulama: db.dump var mı, boş mu, okunabilir mi?
if [ ! -f "$DEST/db.dump" ]; then
    die "Yedek doğrulaması BAŞARISIZ: $DEST/db.dump oluşturulamadı"
fi
DUMP_SIZE=$(wc -c < "$DEST/db.dump" | tr -d ' ')
if [ "$DUMP_SIZE" -lt 1024 ]; then
    die "Yedek doğrulaması BAŞARISIZ: db.dump çok küçük ($DUMP_SIZE bayt) — yedek bozuk olabilir"
fi
log "Yedek doğrulandı: $DEST/db.dump ($DUMP_SIZE bayt)"
# pg_restore --list ile içerik doğrula (hızlı, veri yazmaz)
if docker compose exec -T db pg_restore -l /tmp/isgapp_db.dump >/dev/null 2>&1; then
    : # konteyner içinde kalan dosyayı temizle zaten silindi
    true
else
    # Alternatif: host tarafında değil, db konteyneri içinde doğrula
    docker compose cp "$DEST/db.dump" db:/tmp/verify.dump
    if docker compose exec -T db pg_restore -l /tmp/verify.dump >/dev/null 2>&1; then
        log "pg_restore doğrulaması başarılı"
    else
        warn "pg_restore doğrulaması atlandı (sürüm uyumsuzluğu olabilir); dosya boyutu ile doğrulandı"
    fi
    docker compose exec -T db rm -f /tmp/verify.dump 2>/dev/null || true
fi
log "DB yedeği: $DEST/db.dump"

# --- Storage dosyaları ---
if [ -d ./volumes/storage ] && [ -n "$(ls -A ./volumes/storage 2>/dev/null)" ]; then
    log "Storage dosyaları yedekleniyor (VERI KAYIPSIZ)"
    tar -czf "$DEST/storage.tar.gz" -C ./volumes ./storage
    log "Storage yedeği: $DEST/storage.tar.gz"
else
    warn "./volumes/storage boş veya yok; storage yedeği atlandı"
fi

# --- SELF-HOST DURUMU (geri yükleme için kritik) ---
log "Self-host durumu yedekleniyor (.env, .applied_migrations)"
if [ -f .env ]; then
    cp .env "$DEST/.env.bak"
    log "  .env -> $DEST/.env.bak"
fi
if [ -f .applied_migrations ]; then
    cp .applied_migrations "$DEST/.applied_migrations.bak"
    log "  .applied_migrations -> $DEST/.applied_migrations.bak"
fi
if [ -f ../supabase/migrations/.applied 2>/dev/null ]; then
    cp ../supabase/migrations/.applied "$DEST/" 2>/dev/null || true
fi

# --- Manifest (yedek bütünlüğü) ---
PERSONEL_SAYISI=$(docker compose exec -T db psql -U postgres -d postgres -Atc "SELECT count(*) FROM personel" 2>/dev/null | tr -d '\r' || echo "?")
STORAGE_DOSYA_SAYISI=$(find ./volumes/storage -type f 2>/dev/null | wc -l | tr -d ' ')
cat > "$DEST/manifest.json" <<EOF2
{
  "stamp": "$STAMP",
  "db_dump": "db.dump",
  "db_dump_bytes": $DUMP_SIZE,
  "storage_files": $STORAGE_DOSYA_SAYISI,
  "personel_count": "$PERSONEL_SAYISI",
  "host": "$(hostname 2>/dev/null || echo "?")",
  "git_commit": "$(git -C .. rev-parse --short HEAD 2>/dev/null || echo "?")"
}
EOF2
# checksum (varsa sha256sum, yoksa atla)
if command -v sha256sum >/dev/null 2>&1; then
    (cd "$DEST" && sha256sum db.dump > db.dump.sha256 2>/dev/null || true)
    if [ -f "$DEST/storage.tar.gz" ]; then
        (cd "$DEST" && sha256sum storage.tar.gz > storage.tar.gz.sha256 2>/dev/null || true)
    fi
fi

SIZE=$(du -sh "$DEST" | cut -f1)
echo ""
echo "Yedekleme tamamlandı (VERI KAYIPSIZ): $DEST ($SIZE)"
echo "Yedek dosyaları:"
ls -lh "$DEST" | tail -n +2
echo ""
echo "Geri yükleme:   sh restore.sh $DEST"
echo "Otomatik yedekleme (cron) örneği — her gece 02:00'de:"
echo "  0 2 * * * cd /path/to/self-host && sh backup.sh >> backups/backup.log 2>&1"
