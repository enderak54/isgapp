#!/bin/sh
#
# ISGAPP kullanıcı oluşturma (self-host sarmalayıcı).
#
# Hedef makinede node kurulu olmasını gerektirmez: script isgapp
# konteynerinin içine kopyalanıp oradaki node ile çalıştırılır.
# DATABASE_URL isgapp servisinin ortam değişkenlerinden gelir
# (docker-compose.yml, db:5432'yi işaret eder).
#
# Kullanım:
#   sh create-user.sh --username yonetici --password SIFRE --ad "Ad Soyad" --rol admin
#
# Not: stack ayakta olmalı (docker compose ps)

set -e

# Git Bash / MSYS: konteyner içi yolları (/app/...) Windows yoluna çevirmeyi engelle
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

[ -f .env ] || { echo "HATA: .env bulunamadı. Önce kurulumu çalıştırın: sh setup.sh" >&2; exit 1; }
docker compose ps isgapp --format '{{.Status}}' 2>/dev/null | grep -q "Up" || { echo "HATA: isgapp konteyneri çalışmıyor. Önce: docker compose up -d" >&2; exit 1; }

# /app'te kopyala ki require("pg") container'ın node_modules'unu bulabilsin
docker compose cp ../scripts/create-user.js isgapp:/app/create-user.js

# DATABASE_URL isgapp servisinde tanımlı olduğundan ayrıca parametre gerekmez.
docker compose exec -T isgapp node /app/create-user.js "$@"
