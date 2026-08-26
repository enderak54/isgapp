#!/bin/sh
#
# ISGAPP — Herhangi bir bilgisayara tek-komut kurulum
#
# Windows 10/11: Git Bash'ten çalıştırın
#   sh install.sh
#   sh install.sh -y          # onay sormadan
#
# Linux/macOS: aynı komut
#
# Ne yapar:
#   1. Zaten isgapp reposu içindeyse doğrudan self-host/kur.sh çalıştırır
#   2. Değilse GitHub'dan klonlar (git clone) ve sonra kur.sh çalıştırır
#   3. kur.sh: Docker/git/openssl kontrolü + setup.sh -y (yedek, migrasyon, seed dahil)
#
# Gereksinimler: git, Docker Desktop (Win) / Docker Engine (Linux)
# Detaylı doküman: self-host/README.md ve KURULUM.md

set -e

REPO_URL="https://github.com/enderak54/isgapp.git"
REPO_DIR="isgapp"
ASSUME_YES=0

# Windows 10/11 Git Bash uyumu
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

for arg in "$@"; do
    case "$arg" in
        -y|--yes) ASSUME_YES=1 ;;
        -h|--help)
            echo "Kullanım: sh install.sh [-y|--yes]"
            echo "  -y: onay sormadan kur"
            exit 0
            ;;
    esac
done

log() { printf "===> %s\n" "$*"; }
die() { printf "HATA: %s\n" "$*" >&2; exit 1; }

# Zaten isgapp repo kökünde miyiz? (self-host/kur.sh varsa)
if [ -f "self-host/kur.sh" ] && [ -f "package.json" ]; then
    log "Mevcut isgapp reposu bulundu: $(pwd)"
    REPO_ROOT="$(pwd)"
elif [ -f "../self-host/kur.sh" ]; then
    # self-host içinden çağrıldıysa
    REPO_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
    log "Repo kökü: $REPO_ROOT"
    cd "$REPO_ROOT"
else
    # Dışarıdan çağrı — klonla
    if ! command -v git >/dev/null 2>&1; then
        die "git gerekli. Kurun: https://gitforwindows.org/ (Win) veya apt install git (Linux)"
    fi
    if [ -d "$REPO_DIR/.git" ]; then
        log "Mevcut klon bulundu: ./$REPO_DIR — güncelleniyor"
        env -u MSYS_NO_PATHCONV MSYS2_ARG_CONV_EXCL="" git -C "$REPO_DIR" pull --ff-only 2>&1 | head -20 || true
        REPO_ROOT="$(CDPATH= cd -- "$REPO_DIR" && pwd)"
    else
        log "GitHub'dan klonlanıyor: $REPO_URL"
        env -u MSYS_NO_PATHCONV MSYS2_ARG_CONV_EXCL="" git clone "$REPO_URL" "$REPO_DIR"
        REPO_ROOT="$(CDPATH= cd -- "$REPO_DIR" && pwd)"
    fi
    cd "$REPO_ROOT"
fi

# self-host/kur.sh var mı?
if [ ! -f "self-host/kur.sh" ]; then
    die "self-host/kur.sh bulunamadı ($REPO_ROOT)"
fi

if [ "$ASSUME_YES" = "1" ]; then
    sh self-host/kur.sh -y
else
    sh self-host/kur.sh
fi
