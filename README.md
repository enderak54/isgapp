# isgapp — İSG Takip Sistemi (ISO 45001)

İş Sağlığı ve Güvenliği süreçleri için personel, MYK, risk, eğitim, kaza ve doküman takibi. **ISO 45001:2018** 15 modül, **KVKK/GDPR** uyumlu, **Docker self-host** ile lokal/sunucuda çalışır.

**Canlı demo:** `https://isgapp-psi.vercel.app` · **Self-host doküman:** [`self-host/README.md`](self-host/README.md) · **Kurulum kılavuzu:** [`self-host/KURULUM.md`](self-host/KURULUM.md)

---

## Özellikler

**Personel:** TC doğrulama, MYK/sertifika/operatör belgesi, KKD, oryantasyon, sağlık raporu, adli sicil, görevlendirme, arşiv, ekip/taeron/şantiye atama

**İSG:** Risk Değerlendirme, Yasal Uygunluk, İç Denetim, Acil Durum, Düzeltici Faaliyet, Yönetim Gözden Geçirme, Doküman Kontrol, Performans İzleme

**Destek:** Bağlam Analizi (4.1/4.2), İşçi Katılımı (5.4), OHS Hedefleri (6.2), İletişim Kaydı (7.4), Politika Yönetimi, Yetkinlik Matrisi, Hibrit Çalışma Ergonomi, Psikososyal Risk, Talimat Takibi, Taşeronlar

**Sistem:** Rol bazlı auth (`app_users`/`app_sessions` scrypt), audit log, SARB yedekleme, dosya boyutu muafiyeti (6 alan), MYK kataloğu (290), tema/uyarı ayarları

---

## Teknoloji

`Next.js 16` (App Router, standalone) · `React 19` · `Supabase` (Postgres 17, Auth, Storage, Realtime) · `Docker` · `Tailwind 4` · `TypeScript 5`

---

## Hızlı Başlangıç (Geliştirme)

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint
```

`.env.local` için `self-host/.env.example` şablonunu kullanın.

---

## Self-Host Kurulum (Herhangi bir bilgisayar)

**Gereksinim:** Windows 10/11 (WSL2 + Docker Desktop + Git Bash) veya Linux (Docker Engine 20.10+, 4–8 GB RAM, 20 GB disk)

**A) Tek-komut (önerilen):**
```bash
curl -fsSL https://raw.githubusercontent.com/enderak54/isgapp/main/install.sh | sh
# veya
sh install.sh -y
```

**B) Manuel:**
```bash
git clone https://github.com/enderak54/isgapp.git
cd isgapp/self-host
sh kur.sh        # Linux'ta Docker'ı da kurar
# veya
sh setup.sh -y   # Docker hazırsa
```

**C) Offline (USB):**
```bash
sh self-host/make-package.sh   # -> isgapp-v1.1.28-offline.tar.gz
# Hedefte: tar -xzf isgapp-*.tar.gz && cd isgapp-*/ && sh install.sh
# Windows: install.bat çift tık
```

Sonrası: `http://localhost:3000/giris` — `yonetici` / `yonetici54` (ilk kurulum, `.env` `ADMIN_USERNAME` ile değiştirilebilir)

Detay: [`self-host/README.md`](self-host/README.md)

---

## Güncelleme

**Veri kayıpsız** — `docker compose up -d` volumeları korur, migrasyonlar `IF NOT EXISTS` / `ON CONFLICT`:

```bash
cd self-host
sh update.sh --dry-run   # önizleme
sh update.sh             # yedek + git pull + migrasyon + build + up -d
```

Uygulama içinden: `Ayarlar > Sürüm Takip > Güncelle` (arka planda `isgapp-updater` çalışır, ekranı kapatabilirsiniz).

Geri alma: `sh restore.sh backups/2026-08-26_233845`

---

## Dokümantasyon

- `STANDARDS.md` — kod standartları, ISO 45001/27001, KVKK, OWASP
- `E2E_TEST_SENARYOLARI.md` — test senaryoları
- `DEPLOY_KILAVUZU.md` — deploy notları
- `KUZUT_DEFTERI.md` — mimari notlar

---

## Lisans

Özel — ticari dağıtım için `LICENSE` ekleyin. Varsayılan GitHub `All Rights Reserved`.
