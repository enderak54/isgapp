#!/bin/sh
# ISGAPP tek-kod güncelleme — C: / D: otomatik tespit
# Kullanim:  sh guncelle.sh          (normal, yedek alarak)
#            sh guncelle.sh --dry-run
#            sh guncelle.sh -n       (yedek almadan)
# Her yerden calistirilabilir; isgapp'in C: veya D: de oldugunu otomatik bulur.

set -e
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" 2>/dev/null && pwd)
CANDIDATES="
$SCRIPT_DIR
$SCRIPT_DIR/isgapp
$(pwd)
$(pwd)/isgapp
$HOME/isgapp
/c/isgapp
/d/isgapp
/e/isgapp
/c/Users/$USER/isgapp
/d/Users/$USER/isgapp
"

FOUND=""
for d in $CANDIDATES; do
  # bos veya ayni dizini tekrar kontrol etme
  [ -z "$d" ] && continue
  # normalize trailing slash
  d=$(echo "$d" | tr -d '\r')
  if [ -f "$d/self-host/update.sh" ]; then
    FOUND="$d"
    break
  fi
  if [ -f "$d/update.sh" ] && [ -d "$d/supabase" ]; then
    # self-host icindeyken repo kokunu bir uste al
    FOUND=$(dirname "$d")
    # self-host/update.sh var mi kontrol
    if [ -f "$FOUND/self-host/update.sh" ]; then
      FOUND="$FOUND"
      break
    fi
    FOUND="$d"
    break
  fi
done

# Ekstra: drive harflerini tarayarak self-host ara (Git Bash /c /d mount)
if [ -z "$FOUND" ]; then
  for drv in c d e f; do
    if [ -f "/$drv/isgapp/self-host/update.sh" ]; then FOUND="/$drv/isgapp"; break; fi
  done
fi

if [ -z "$FOUND" ]; then
  echo "HATA: isgapp bulunamadi." >&2
  echo "Aranan yerler:" >&2
  for d in $CANDIDATES; do echo "  - $d/self-host/update.sh" >&2; done
  echo "isgapp'i C:/isgapp veya D:/isgapp altina klonlayin veya bu scripti repo koku icinde calistirin." >&2
  exit 1
fi

# self-host icinde mi yoksa repo kokunde mi?
if [ -f "$FOUND/self-host/update.sh" ]; then
  TARGET_DIR="$FOUND/self-host"
  REPO_LABEL="$FOUND"
else
  TARGET_DIR="$FOUND"
  REPO_LABEL="$FOUND"
fi

echo "==> isgapp bulundu: $REPO_LABEL"
echo "==> guncelleme baslatiliyor: $TARGET_DIR/update.sh $*"
cd "$TARGET_DIR"
# update.sh zaten backup + git pull + migrasyon + build yapar
sh update.sh "$@"
