#!/bin/sh
#
# ISGAPP tam otomatik kurulum script'i.
#
# Ne yapar (sırayla):
#   1. Platformu algılar (Linux / Windows Git Bash / macOS)
#   2. Ön koşulları kurar (Docker, Docker Compose plugin, git, openssl):
#      - Linux:  apt/dnf ile otomatik kurar (Docker resmi reposu/apt)
#      - Windows: Docker Desktop kuruluysa devam eder, değilse talimat verir
#      - macOS:  brew ile kurmaya çalışır
#   3. `sh setup.sh -y` ile kurulumu tamamlar (seed + storage + admin dahil)
#
# Kullanım:
#   sh kur.sh          # tüm kurulumu tamamlar
#   sh kur.sh -y       # onay sormadan (setup.sh -y ile aynı)
#
# Not:
#   - Script'in bulunduğu dizin (self-host/) repo kökünde olmalıdır.
#   - Windows'ta Git Bash (MSYS) içinden çalıştırın.
#   - Root şifresi gerektiren kurulum adımları sudo kullanır; kullanıcı
#     docker grubuna eklendikten sonra yeniden giriş gerekebilir.

set -e

# Windows 10/11 Git Bash: setup.sh içindeki /app, /tmp yolları için gerekirse
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

ASSUME_YES=0

print_help() {
    cat <<EOF
Kullanım: kur.sh [seçenekler]

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

confirm() {
    [ "$ASSUME_YES" = "1" ] && return 0
    printf "%s [E/h]: " "$1"
    read -r ans
    case "$ans" in
        ""|e|E|evet|Evet|EVET) return 0 ;;
        *) return 1 ;;
    esac
}

# --- Platform algılama -----------------------------------------------------

OS="$(uname -s 2>/dev/null || echo unknown)"
IS_WINDOWS=0
case "$OS" in
    MINGW*|MSYS*|CYGWIN*) IS_WINDOWS=1 ;;
    Linux) ;;
    Darwin) ;;
    *) die "Desteklenmeyen platform: $OS" ;;
esac

log "Platform: $OS"

# Root kontrolü (Linux/macOS'ta apt/brew kurulumları için sudo gerekebilir)
HAVE_SUDO=0
if command -v sudo >/dev/null 2>&1; then
    HAVE_SUDO=1
fi

run_root() {
    # sudo varsa onunla, yoksa doğrudan çalıştır
    if [ "$HAVE_SUDO" = "1" ]; then
        sudo sh -c "$1"
    else
        sh -c "$1"
    fi
}

# --- 1. git + openssl -------------------------------------------------------

if ! command -v git >/dev/null 2>&1; then
    log "git kuruluyor"
    if [ "$IS_WINDOWS" = "1" ]; then
        die "git gerekli. Git Bash kurun: https://gitforwindows.org/ (veya: winget install --id Git.Git)"
    elif [ "$OS" = "Darwin" ]; then
        command -v brew >/dev/null 2>&1 || die "brew gerekli. https://brew.sh"
        brew install git
    elif command -v apt-get >/dev/null 2>&1; then
        run_root "apt-get update -y && apt-get install -y git"
    elif command -v dnf >/dev/null 2>&1; then
        run_root "dnf install -y git"
    else
        die "Paket yöneticisi tanınamadı; git'i elle kurun."
    fi
else
    log "git: $(git --version)"
fi

if ! command -v openssl >/dev/null 2>&1; then
    log "openssl kuruluyor"
    if [ "$IS_WINDOWS" = "1" ]; then
        die "openssl gerekli. Git Bash kurun: https://gitforwindows.org/"
    elif [ "$OS" = "Darwin" ]; then
        brew install openssl
    elif command -v apt-get >/dev/null 2>&1; then
        run_root "apt-get update -y && apt-get install -y openssl"
    elif command -v dnf >/dev/null 2>&1; then
        run_root "dnf install -y openssl"
    else
        die "openssl elle kurulmalı."
    fi
else
    log "openssl: $(openssl version | head -c 20)"
fi

# --- 2. Docker + Compose plugin --------------------------------------------

if command -v docker >/dev/null 2>&1; then
    log "docker: $(docker --version)"
else
    log "docker kuruluyor"
    if [ "$IS_WINDOWS" = "1" ]; then
        echo ""
        echo "Docker bulunamadı. Windows'ta Docker Desktop kurun:"
        echo "  winget install -e --id Docker.DockerDesktop"
        echo "  (veya: https://www.docker.com/products/docker-desktop/)"
        echo "Kurulumdan sonra Docker Desktop'ı başlatın ve tekrar çalıştırın:"
        echo "  sh kur.sh"
        exit 1
    elif [ "$OS" = "Darwin" ]; then
        echo "macOS'ta Docker Desktop kurun: https://www.docker.com/products/docker-desktop/"
        echo "  (veya: brew install --cask docker)"
        exit 1
    elif command -v apt-get >/dev/null 2>&1; then
        log "Docker kuruluyor (apt + resmi repo)"
        run_root "apt-get update -y && apt-get install -y ca-certificates curl gnupg"
        run_root "install -m 0755 -d /etc/apt/keyrings"
        run_root "curl -fsSL https://download.docker.com/linux/\$(. /etc/os-release && echo \$ID)/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg"
        run_root "chmod a+r /etc/apt/keyrings/docker.gpg"
        run_root "echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/\$(. /etc/os-release && echo \$ID) \$(. /etc/os-release && echo \$VERSION_CODENAME) stable\" | tee /etc/apt/sources.list.d/docker.list > /dev/null"
        run_root "apt-get update -y"
        run_root "apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"
    elif command -v dnf >/dev/null 2>&1; then
        log "Docker kuruluyor (dnf)"
        run_root "dnf install -y dnf-plugins-core"
        run_root "dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo"
        run_root "dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"
        run_root "systemctl enable --now docker"
    else
        die "Paket yöneticisi tanınamadı; Docker'ı elle kurun: https://docs.docker.com/engine/install/"
    fi
fi

if ! docker compose version >/dev/null 2>&1; then
    die "docker compose plugin gerekli. Kurulum: https://docs.docker.com/compose/install/"
fi
log "docker compose: $(docker compose version | head -c 40)"

# --- 3. Docker daemon + kullanıcı grubu ------------------------------------

if [ "$IS_WINDOWS" = "1" ]; then
    # Docker Desktop — daemon'ın çalışmasını bekle
    log "Docker Desktop daemon'ı kontrol ediliyor"
    for i in $(seq 1 30); do
        if docker info >/dev/null 2>&1; then break; fi
        sleep 2
    done
fi

if ! docker info >/dev/null 2>&1; then
    if [ "$IS_WINDOWS" = "1" ]; then
        die "Docker Desktop çalışmıyor. Docker Desktop'ı başlatıp tekrar deneyin."
    else
        log "Docker daemon başlatılıyor ve kullanıcı docker grubuna ekleniyor"
        if command -v systemctl >/dev/null 2>&1; then
            run_root "systemctl enable --now docker" || warn "systemctl ile docker başlatılamadı"
        elif command -v service >/dev/null 2>&1; then
            run_root "service docker start" || warn "service docker start başarısız"
        fi
        # Kullanıcıyı docker grubuna ekle (tekrar giriş sonrası sudo'suz docker)
        CURRENT_USER="$(id -un 2>/dev/null || echo "")"
        if [ -n "$CURRENT_USER" ] && [ "$CURRENT_USER" != "root" ]; then
            run_root "usermod -aG docker '$CURRENT_USER'" 2>/dev/null || warn "docker grubuna eklenemedi (sudo gerekli olabilir)"
        fi
        for i in $(seq 1 30); do
            if docker info >/dev/null 2>&1; then break; fi
            sleep 2
        done
        if ! docker info >/dev/null 2>&1; then
            die "Docker daemon hâlâ çalışmıyor. Manuel başlatın: sudo systemctl start docker (ya da tekrar giriş yapın)."
        fi
    fi
fi

# --- 4. Repo ve setup -------------------------------------------------------

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"
REPO_ROOT=$(dirname "$SCRIPT_DIR")

if [ ! -d "$REPO_ROOT/.git" ]; then
    die "Git deposu bulunamadı: $REPO_ROOT (self-host dizininin üst klasöründe repo olmalı)"
fi

log "Kurulum başlatılıyor (self-host: $SCRIPT_DIR)"
confirm "Kurulum başlatılsın mı?" || { echo "İptal edildi."; exit 0; }

sh setup.sh -y

echo ""
echo "=============================================================="
echo " KURULUM TAMAMLANDI"
echo "=============================================================="
echo " Uygulama:   http://localhost:$(grep '^ISGAPP_HTTP_PORT=' .env | cut -d= -f2- | tr -d '\r')/giris"
echo " Güncelleme: sh update.sh  (veya Ayarlar > Sürüm Takip > Güncelle)"
echo "=============================================================="
