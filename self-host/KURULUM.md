# isgapp — Ayrıntılı Kurulum Rehberi

Bu rehber, isgapp self-host paketini (Supabase stack + uygulama) sıfırdan, adım adım
kurmanı sağlar. **Windows** ve **Linux** için ayrı bölümler vardır.

> Kısa özet için `README.md`'ye bakabilirsin; bu rehber her adımı açıklar.

---

## Yol Haritası

```
Windows:  Windows Update → WSL2 + Sanal Makine etkinleştir → WSL çekirdeği kur
          → YENİDEN BAŞLAT → Docker Desktop kur/aç → Git for Windows kur
          → doğrulama → git clone → sh setup.sh → kullanıcı oluştur

Linux:    Docker Engine + Compose plugin kur → node/npm kur → git clone
          → sh setup.sh → kullanıcı oluştur
```

Kurulum sırasında her adımda **çıktıyı kontrol et**; bir adım hata verirse sonraki
adıma geçme.

---

# A) Windows Kurulumu

## A.1 Ön koşullar

- **Windows 10** (sürüm 2004 / build 19041 veya daha yeni) **veya Windows 11**
  - Kontrol: `Win+R` → `winver` → satırda "2004" veya üzeri, ya da "11" yazmalı.
- **Sanallaştırma açık olmalı** (BIOS'ta VT-x/AMD-V).
  - Kontrol: `Görev Yöneticisi → Performans → CPU → Sanallaştırma: Etkin`
  - Kapalıysa BIOS'a girip (F2/Del) `Intel VT-x` / `SVM Mode` → Etkin → kaydet.

## A.2 Windows Güncelleme (önerilir, WSL2 için kritik)

WSL2, eski Windows sürümlerinde çalışmaz. Eksikse:

1. `Ayarlar → Güncelleme ve Güvenlik → Windows Update` → **Güncellemeleri denetle**
2. Tüm güncellemeleri kur, yeniden başlat.

## A.3 WSL2 + Sanal Makine Platformu etkinleştir

**PowerShell'i Yönetici olarak aç** (Başlat'a sağ tık → "Windows PowerShell (Yönetici)") ve şunları çalıştır:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

İkisi de `İşlem başarıyla tamamlandı` yazmalı.

## A.4 WSL çekirdeği kur ve WSL'i güncelle

Hâlâ yönetici PowerShell'de:

```powershell
wsl --update
wsl --install --no-distribution
```

Not: `wsl --update` çalışmazsa (eski Windows), WSL çekirdeğini elle kur:
https://learn.microsoft.com/windows/wsl/install-manual → **x64 MSI** indir → çalıştır.

## A.5 YENİDEN BAŞLAT

Bu adımı atlama — WSL ancak yeniden başlatma sonrası çalışır. Bilgisayarı yeniden başlat.

## A.6 WSL'i doğrula (yeniden başlatma sonrası)

PowerShell'i normal (yönetici gerekmez) aç:

```powershell
wsl --status
wsl -l -v
```

- `wsl -l -v` **hata vermeden** bir liste döndürmeli (dağıtım listesi boş olabilir, sorun değil).
- `wsl --status` "Varsayılan sürüm: 2" gibi bir bilgi göstermeli.

> ⚠️ **Burada "CommandTimedOut" hatası alırsan** (ör. `DockerDesktop/Wsl/CommandTimedOut`):
> 1. A.3 adımlarını yönetici PowerShell'de tekrar çalıştır, çıktıyı oku.
> 2. A.5'i (tam yeniden başlatma) tekrar yap.
> 3. Windows'un güncel olduğunu doğrula (A.2).
> 4. Hâlâ timeout: `Windows Update`'te "İsteğe bağlı güncellemeler → Linux çekirdek güncellemesi" varsa kur.

## A.7 Docker Desktop kur

PowerShell'de:

```powershell
winget install -e --id Docker.DockerDesktop
```

veya https://www.docker.com/products/docker-desktop/ adresinden indirip kur.

## A.8 Docker Desktop'ı başlat ve ayarla

1. Başlat menüsü → **Docker Desktop** → aç.
2. İlk açılışta "Use WSL 2 instead of Hyper-V" sorusu gelirse **WSL 2** seç.
3. Sistem tepsisindeki balina simgesi **yeşil** olana kadar bekle (ilk açılışta 2-5 dk).
4. Ayarlar → General → "Use the WSL 2 based engine" **işaretli** olsun.
5. Ayarlar → Resources → WSL Integration → "Enable integration with my default WSL distro" işaretli olsun.

## A.9 Git for Windows kur

```powershell
winget install -e --id Git.Git
```

veya https://git-scm.com/downloads adresinden indirip kur (varsayılan ayarlar yeterli).
Bununla birlikte **Git Bash** gelir.

## A.10 Doğrulama

**Git Bash'i aç** (Başlat menüsünde "Git Bash") ve şunları tek tek çalıştır:

```bash
git --version
docker --version
docker compose version
docker info
```

- `git --version` sürüm yazmalı.
- `docker info` hata vermeden uzun bir çıktı döndürmeli (en sonlarda `Server Version: ...` olmalı).
- `docker info` "Cannot connect to the Docker daemon" derse Docker Desktop tam açılmamış demektir — A.8'i tekrar dene, balinanın yeşil olduğundan emin ol.

## A.11 Kurulumu başlat

Git Bash'te (klavye yerine kopyala-yapıştır → Git Bash'te **sağ tık → Paste**):

```bash
git clone https://github.com/enderak54/isgapp.git
cd isgapp/self-host
sh setup.sh
```

`setup.sh` şunları yapacak (birkaç dakika):

1. `.env` oluşturur ve tüm sırları üretir
2. URL'leri sorar (varsayılan için Enter)
3. Docker imajlarını çeker, isgapp'i derler, stack'i başlatır
4. `.applied_migrations` dosyasını oluşturur

## A.12 İlk kullanıcıyı oluştur

Kurulum bittikten sonra repo kökünde (Git Bash):

```bash
cd /c/Users/ENDER/isgapp
npm install
npm run create-user -- --username kullanici --password "GucluSifre123" --ad "Ad Soyad" --rol admin
```

Uygulama: `http://localhost:3000/giris` — kullanıcı adı + şifre ile giriş.
Studio: `http://localhost:8000` — `.env` içindeki `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD`.

---

# B) Linux Kurulumu (Ubuntu/Debian)

## B.1 Docker Engine kur

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**Kullanıcıyı docker grubuna ekle** (sudo'ya her seferinde şifre istememek için):

```bash
sudo usermod -aG docker $USER
# oturumu kapatıp aç (veya: newgrp docker)
```

## B.2 Servisi başlat ve doğrula

```bash
sudo systemctl enable --now docker
docker info          # hata vermemeli
docker compose version
```

## B.3 Node.js + npm kur

```bash
sudo apt install -y nodejs npm
node -v
npm -v
```

> Daha güncel Node istersen: https://nodejs.org → LTS tarball'ı veya `nvm` kullan.

## B.4 Kurulumu başlat

```bash
git clone https://github.com/enderak54/isgapp.git
cd isgapp/self-host
sh setup.sh
```

## B.5 İlk kullanıcı

```bash
cd ..
npm install
npm run create-user -- --username kullanici --password "GucluSifre123" --ad "Ad Soyad" --rol admin
```

---

# Kurulum Sonrası Kontrol

```bash
cd self-host
docker compose ps          # tüm servisler "Up/healthy" olmalı
docker compose logs -f isgapp   # uygulama logları
```

| Servis | Adres |
|---|---|
| isgapp (uygulama) | http://localhost:3000/giris |
| Supabase Studio | http://localhost:8000 |
| REST API | http://localhost:8000/rest/v1 |

Studio girişi: `self-host/.env` içindeki `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`.

---

# Sorun Giderme

## `DockerDesktop/Wsl/CommandTimedOut` — `wsl.exe -l -v` zaman aşımı

- **Sebep:** WSL özellikleri aktifleştirildi ama Windows yeniden başlatılmadı; ya da WSL çekirdeği eksik/eski.
- **Çözüm:**
  1. Yönetici PowerShell'de A.3 komutlarını tekrar çalıştır (çıktıya bak, `İşlem başarıyla tamamlandı` olmalı).
  2. `wsl --update` çalıştır (A.4).
  3. **Tam yeniden başlatma** yap.
  4. `wsl -l -v` hata vermez hale gelmeli.
  5. Docker Desktop'ı tekrar aç.
- Hâlâ olmuyorsa Windows güncellemesi eksik olabilir (A.2).

## `HATA: Docker daemon çalışmıyor`

- **Windows:** Docker Desktop'ı aç, balina simgesi yeşil olana kadar bekle, sonra `docker info` dene.
- **Linux:** `sudo systemctl enable --now docker` ve `sudo usermod -aG docker $USER`.

## `docker: command not found`

- Docker kurulmamış. Windows: A.7 | Linux: B.1.

## `sh: command not found` / `The term 'sh' is not recognized`

- Windows'ta komutlar **PowerShell'de değil, Git Bash'te** çalıştırılmalı (A.9).
- Git Bash açmak için Başlat'a "Git Bash" yaz.

## Yapıştırma sorunları (`^[[200~`, satırların karışması)

- Tüm komut bloğunu aynı anda yapıştırma. **Her satırı ayrı ayrı** yapıştır → Git Bash'te **sağ tık → Paste** → Enter.
- Kopyaladığın satırda satır sonu varsa o da soruna yol açar; satırı temiz kopyala.

## `cd isgapp/self-host: No such file or directory`

- `isgapp` klasörünü yanlış yazdın (`sgapp` vb.) ya da `git clone` başarısız oldu.
- Önce `ls` ile klasörü listele, doğru adı gör, sonra `cd`.

## CRLF / script hataları (`sh: ./setup.sh: bad interpreter`, garip `\r` hataları)

- Repo `.gitattributes` ile LF satır sonu zorlar; Windows'ta clone sonrası scriptler kırılmaz.
- Yine de sorun olursa Git Bash'te:
  ```bash
  git config --global core.autocrlf false
  # repo'yu yeniden çek
  ```

## Supabase imajları çok indirme/kaynak yetersiz

- Supabase stack'i 4-8 GB RAM ister. Docker Desktop → Settings → Resources → Memory'i **6 GB** üstüne çek.
- `docker compose ps`'te servisler "Restarting" döngüsünde ise RAM/disk kontrol et.

---

## Güncelleme & Yedekleme

Ayrıntılar `README.md` içinde:

```bash
cd self-host
sh backup.sh     # yedek al
sh update.sh     # güncelle (yedek + git pull + migrasyon + isgapp rebuild)
```
