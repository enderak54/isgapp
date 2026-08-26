#!/bin/sh
#
# ISGAPP — Offline kurulum paketi oluşturur (herhangi bir bilgisayara USB ile taşı)
#
# Çıktı: isgapp-vX.Y.Z-offline.zip (repo kökünde)
# İçerik: self-host + Dockerfile + package.json + app/components/lib/supabase/scripts
#         (node_modules, .git, .next, volumes/db/data hariç)
#
# Windows 10/11: Git Bash'ten sh self-host/make-package.sh
# Linux: sh self-host/make-package.sh

set -e

# Windows 10/11 Git Bash uyumu
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(dirname "$SCRIPT_DIR")
cd "$REPO_ROOT"

VERSION=$(grep '"version"' package.json | sed -E 's/.*"version": *"([^"]+)".*/\1/' | tr -d '\r')
[ -z "$VERSION" ] && VERSION="0.0.0"
PKG_NAME="isgapp-v${VERSION}-offline"
OUT_FILE="${PKG_NAME}.zip"
TMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t isgapp)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

log() { printf "===> %s\n" "$*"; }
die() { printf "HATA: %s\n" "$*" >&2; exit 1; }

if command -v zip >/dev/null 2>&1; then
    PKG_TOOL="zip"
elif command -v tar >/dev/null 2>&1; then
    PKG_TOOL="tar"
    OUT_FILE="${PKG_NAME}.tar.gz"
else
    die "zip veya tar gerekli (Git Bash'e dahil olmalı; yoksa: apt install zip)"
fi

log "Paket oluşturuluyor: $OUT_FILE (v$VERSION) [$PKG_TOOL]"
mkdir -p "$TMP_DIR/$PKG_NAME"

# Dahil edilecekler (kurulum için gerekli minimum)
cp -r self-host "$TMP_DIR/$PKG_NAME/"
cp Dockerfile "$TMP_DIR/$PKG_NAME/" 2>/dev/null || true
cp package.json package-lock.json next.config.ts tsconfig.json "$TMP_DIR/$PKG_NAME/" 2>/dev/null || true
cp -r app components lib public scripts supabase "$TMP_DIR/$PKG_NAME/" 2>/dev/null || true
cp install.sh install.bat "$TMP_DIR/$PKG_NAME/" 2>/dev/null || true
cp README.md "$TMP_DIR/$PKG_NAME/" 2>/dev/null || true
cp .env.example "$TMP_DIR/$PKG_NAME/" 2>/dev/null || true
cp .gitattributes .dockerignore "$TMP_DIR/$PKG_NAME/" 2>/dev/null || true

# Hariç tutulacaklar (büyük/gereksiz)
rm -rf "$TMP_DIR/$PKG_NAME/self-host/volumes/db/data" 2>/dev/null || true
rm -rf "$TMP_DIR/$PKG_NAME/self-host/backups" 2>/dev/null || true
rm -rf "$TMP_DIR/$PKG_NAME/.git" 2>/dev/null || true
rm -rf "$TMP_DIR/$PKG_NAME/node_modules" 2>/dev/null || true
rm -rf "$TMP_DIR/$PKG_NAME/.next" 2>/dev/null || true
rm -f "$TMP_DIR/$PKG_NAME/.env" "$TMP_DIR/$PKG_NAME/.env.local" 2>/dev/null || true

# Paket oluştur
rm -f "$OUT_FILE" "${PKG_NAME}.zip" "${PKG_NAME}.tar.gz"
if [ "$PKG_TOOL" = "zip" ]; then
    ( cd "$TMP_DIR" && zip -r -q "$REPO_ROOT/$OUT_FILE" "$PKG_NAME" )
    SIZE=$(du -h "$OUT_FILE" 2>/dev/null | cut -f1)
    COUNT=$(unzip -l "$OUT_FILE" 2>/dev/null | tail -1 | awk '{print $2}' || echo "?")
    echo ""
    echo "Paket hazır: $OUT_FILE ($SIZE, $COUNT dosya)"
    echo "Kullanım (hedef bilgisayarda):"
    echo "  1) Zip'i aç:  unzip $OUT_FILE  (veya tar -xzf *.tar.gz)"
    echo "  2) Kur:       cd $PKG_NAME && sh install.sh"
    echo "     veya Windows'ta: $PKG_NAME/install.bat cift tik"
else
    ( cd "$TMP_DIR" && tar -czf "$REPO_ROOT/$OUT_FILE" "$PKG_NAME" )
    SIZE=$(du -h "$OUT_FILE" 2>/dev/null | cut -f1)
    COUNT=$(tar -tzf "$OUT_FILE" 2>/dev/null | wc -l | tr -d ' ')
    echo ""
    echo "Paket hazır: $OUT_FILE ($SIZE, $COUNT dosya)"
    echo "Kullanım: tar -xzf $OUT_FILE && cd $PKG_NAME && sh install.sh"
    echo "     veya Windows'ta zip'e çevirip install.bat"
fi
echo ""
echo "Not: Hedefte Docker Desktop + Git Bash kurulu olmalı."
