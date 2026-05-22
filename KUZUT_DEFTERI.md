# İSGGAPP — Kütük Defteri

## 1. Proje Kimliği

| Alan | Değer |
|------|-------|
| Ad | İSGGAPP |
| Sürüm | 1.1.0 |
| Depo | https://github.com/enderak54/isgapp |
| Canlı | https://isgapp-psi.vercel.app |
| Supabase | https://wnbrltpughawrvdmeqhk.supabase.co |
| Çatı | Next.js (App Router) |
| Veritabanı | PostgreSQL (Supabase) |
| Kimlik | Henüz yok (public RLS, geliştirme modu) |
| Dağıtım | Vercel |

## 2. Dizin Yapısı

```
isgapp/
├── app/                    # Next.js App Router sayfaları
│   ├── page.tsx            # Ana sayfa (Personel Kayıt Formu)
│   ├── layout.tsx          # Root layout
│   ├── personel/page.tsx   # Personel Listesi
│   ├── dashboard/page.tsx  # İSG Takip Dashboard
│   ├── myk/page.tsx        # MYK Belgeleri
│   ├── operator/page.tsx   # Operatör Belgeleri
│   ├── dosya/page.tsx      # Personel Dosyası
│   ├── talimatlar/page.tsx # Talimat Takibi
│   ├── santiyeler/page.tsx # Şantiyeler
│   ├── taseronlar/         # Taşeronlar
│   ├── sorumlular/         # Sorumlular
│   ├── ekipmanlar/         # İş Ekipmanları
│   ├── kazalar/            # İş Kazaları
│   ├── egitimler/          # Eğitimler
│   ├── ihtar/              # İhtar Tutanağı
│   ├── audit-log/          # Denetim Günlüğü (audit_log görüntüleyici)
│   ├── ayarlar/page.tsx    # Ayarlar
│   ├── risk/ → performans/ # ISO 45001 Ek Modüller (9 adet)
│   └── api/                # API route'lar
│       ├── commits/route.ts  # GitHub commit proxy
│       └── backup/route.ts   # Veritabanı yedekleme (JSON dışa aktarım)
├── components/             # Tüm UI bileşenleri
│   ├── sidebar.tsx         # Sol menü (dinamik sıralama + modül gizleme)
│   ├── personnel-form.tsx  # Personel kayıt formu
│   ├── personnel-list.tsx  # Personel listesi + detay/düzenleme modalı
│   ├── dashboard.tsx       # Dashboard istatistikler + uyarılar
│   ├── myk-belgeleri.tsx   # MYK liste/matris görünümü
│   ├── audit-log-viewer.tsx # Denetim günlüğü (audit_log tablosu)
│   ├── settings.tsx        # Tema, modül, uyarı, menü, AI, sürüm ayarları
│   ├── operator-belgeleri.tsx, is-kazalari.tsx, personel-dosyasi.tsx,
│   │   talimatlar.tsx, egitimler.tsx, is-ekipmanlari.tsx,
│   │   santiyeler.tsx, taseronlar.tsx, sorumlular.tsx, ihtar-tutanagi.tsx
│   ├── risk-degerlendirme.tsx → performans-izleme.tsx  # ISO 45001
│   └── yetkinlik-matrisi.tsx
├── lib/                    # Paylaşılan kütüphane fonksiyonları
│   ├── supabase.ts         # Supabase client
│   ├── security.ts         # XSS sanitizasyon, TC doğrulama, rate limit, şifreleme
│   ├── audit.ts            # Denetim günlüğü (CRUD loglama)
│   ├── file-validation.ts  # Dosya boyut/tip validasyonu
│   ├── egitim-uyari.ts     # ISG eğitim uyarı hesaplamaları
│   ├── tarih.ts            # Tarih formatlama (gg.aa.yyyy) ve kalan süre
│   └── use-idle-timeout.ts # 30dk oturum zaman aşımı
├── middleware.ts           # CSP nonce + güvenlik başlıkları (runtime)
│   └── migrations/         # 027 adımlı veritabanı migrasyonları
├── public/                 # Statik dosyalar
├── next.config.ts          # Next.js yapılandırması + güvenlik başlıkları
└── package.json            # Bağımlılıklar (v1.1.0)
```

## 3. Veritabanı Şeması

### `personel` — Ana tablo (aktif + arşiv)
Tüm ISG eğitim alanları (`isg_egitim_tarihi`, `yuksekte_calisma_tarihi`, `myk_tarihi`, `sertifika_tarihi`, `operator_belgesi_tarihi`, `kkd_tarihi`, `oryantasyon_tarihi`, `saglik_raporu_tarihi`) ve her biri için karşılık gelen `*_gecerlilik_suresi` (INTEGER 1-5) sütunları.
- `arsivde` BOOLEAN default false
- `ayrilis_tarihi` DATE, `ayrilis_nedeni` TEXT

### `personel_belgeleri` — Dosya ekleri
- `personel_id`, `dosya_adi`, `dosya_url`, `dosya_turu`, `field`, `eklenme_tarihi`, `guncelleme_tarihi`, `silinme_tarihi`

### `personel_myk_egitimleri` — MYK eğitim kayıtları (junction)
- `personel_id`, `myk_egitim_id`, `alis_tarihi`, `gecerlilik_suresi`

### `myk_egitim_listesi` — MYK eğitim tanımları
- `ad`, `aktif` BOOLEAN

### `audit_log` — Denetim günlüğü
- `table_name`, `record_id`, `action` (INSERT/UPDATE/DELETE/ARCHIVE), `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`

### `ayarlar` — Anahtar-değer yapılandırma
- `key`, `value`, `type`, `description`
- Tipler: `theme`, `module`, `egitim_uyari`, `kvkk`, `menu_order`, `ai`

### `kvkk_consents` — KVKK onayları
### `versiyonlar` — Sürüm kayıtları (manuel)
### `operator_belgeri`, `is_kazalari`, `ihtarlar` vb.
### `yedekleme_log` — Yedekleme geçmişi (Migration 030)

**RLS**: Tüm tablolar public (auth yok). Geliştirme modu.

## 4. Mimari Kararlar

### Navigasyon
- `sidebar.tsx` iki menü grubunu yönetir: **Ana Menü** (14 öğe) ve **Ek Modüller** (9 ISO 45001 öğesi)
- Her öğenin `key` değeri, modül görünürlüğü (`ayarlar.type='module'`) ve menü sırası (`ayarlar.type='menu_order'`) için referanstır
- Menü sırası Ayarlar sayfasından drag-drop ile değiştirilebilir

### Bileşen Kalıbı
Her sayfa aynı yapıyı izler:
```
app/x/page.tsx  →  <Sidebar /> + <XComponent />
components/x.tsx  →  "use client"; useState + useEffect + Supabase sorguları
```

### Tarih Formatı
Standart: **gg.aa.yyyy** (Türkiye). `lib/tarih.ts`:
- `formatDate(iso)` — ISO → gg.aa.yyyy
- `displayDate(iso)` — null-safe formatDate
- `kalanSureText(hedefISO)` — Gerçek takvim farkı (yıl/ay/gün)

### Güvenlik (`lib/security.ts`)
- `sanitize(str)` — XSS temizleme (HTML etiketi kaldırma)
- `sanitizeForm(obj)` — Tüm metin alanlarını temizle
- `validateTC(tc)` — TC kimlik checksum doğrulaması
- `maskTC(tc)` — `********123` formatı
- `checkRateLimit(key, max, windowMs)` — Rate limiting
- `encryptField / decryptField` — Simetrik şifreleme
- `generateNonce` — CSP nonce üreteci

### Dosya Yükleme
- Supabase Storage (`isg-files` bucket)
- `lib/file-validation.ts`: MIME + boyut kontrolü
- Drag-drop arayüzü, metadata `personel_belgeleri` tablosunda
- Soft-delete (`silinme_tarihi`)

### Kilit Mekanizması
Silme işlemleri iki adımlı: önce kilit aç (Unlock ikonu), sonra sil butonu görünür.
Her listede `lockedX` Set state'i ile yönetilir.

## 5. Sayfa Akışları

### Personel Kaydı
1. Ana sayfa (`/`) → `personnel-form.tsx`
2. Zorunlu alanlar: TC, Ad, Soyad, İSG tarih, Yüksekte tarih, MYK, KKD, Sağlık Raporu
3. Geçerlilik süresi (1-5 yıl) her tarih için zorunlu
4. MYK eğitimleri: dropdown + tarih + süre + Ekle / Kaldır
5. Dosyalar: drag-drop, her eğitim alanına özel
6. Kayıt → Supabase INSERT → audit log → dosya upload → MYK kayıtları insert
7. **Arşiv kontrolü**: TC arşivde varsa uyarı gösterilir

### Personel Listesi (`/personel`)
- Aktif/Arşiv toggle ile görüntüleme
- Sıralanabilir kolon başlıkları (▲▼)
- Detay modalı: tüm ISG belge durumları + uyarı göstergeleri
- Düzenleme modalı: formdaki tüm alanlar + MYK yönetimi
- Silme: "İşten Ayrılış" (arşiv) / "Hatalı Kayıt" (kalıcı sil)
- Arşiv görünümü: "Geri Al" + "Sil" butonları

### MYK Sayfası (`/myk`)
- **Liste**: `personel_myk_egitimleri` verisi, sıralanabilir tarihler, kalan süre
- **Matris**: Personel × MYK eğitim çapraz tablosu

### Dashboard (`/dashboard`)
- Personel sayısı, kaza istatistikleri, KSO oranı
- Sağlık sorunlu personel sayısı
- **ISG Uyarı Listesi**: Bitiş tarihi yaklaşan/geçen eğitimler (ayarlardaki eşiklere göre)

### Ayarlar (`/ayarlar`)
- **Görünüm**: Tema (açık/koyu), renk, yazı tipi, boyut
- **Modül Ayarları**: Tüm menü öğelerinin göster/gizle
- **Uyarı Süreleri**: Her ISG eğitimi için ayrı bitiş uyarı eşiği (gün)
- **Menü Düzenle**: Drag-drop ile sıralama
- **Yapay Zeka Entegrasyonları**: Projeye katkı sağlayan YZ sistemleri listesi
- **Yedekleme**: Tam (tüm tablolar + dosya URL'leri) veya Kısmi (seçili tablolar) — API route `/api/backup` JSON olarak dışa aktarır, `yedekleme_log` tablosuna kaydeder
- **Sürüm Takip**: GitHub commit geçmişi

## 6. Ek Modüller (ISO 45001)

9 adet açılır/kapanır modül, her biri aynı CRUD kalıbını izler:
1. Risk Değerlendirme
2. Yasal Uygunluk
3. İç Denetim
4. Acil Durum
5. Düzeltici Faaliyet
6. Yönetim Gözden Geçirme
7. Doküman Kontrol
8. Yetkinlik Matrisi
9. Performans İzleme

## 7. Güvenlik Başlıkları

### `next.config.ts` (Edge/Static)
- CSP (Content Security Policy) — `'unsafe-inline'` ile (Next.js uyumluluğu)
- HSTS (Strict-Transport-Security)
- X-Frame-Options, X-Content-Type-Options
- Referrer-Policy, Permissions-Policy
- `connect-src`: Supabase + GitHub API

## 8. Genişletme Kılavuzu

### Yeni Sayfa Eklemek
1. `app/yeni-sayfa/page.tsx` — `<Sidebar />` + `<Bilesen />`
2. `components/yeni-bilesen.tsx` — `"use client"`, Supabase sorguları
3. `sidebar.tsx` — `mainMenuItems[]` veya `ekModulItems[]`'a ekle
4. Migration ile `ayarlar` tablosuna varsayılan modül durumunu ekle

### Yeni Veritabanı Tablosu
1. `supabase/migrations/XXX_adi.sql` — CREATE TABLE + RLS
2. `npx supabase db push` ile uygula
3. TypeScript tipini elle veya `supabase_generate_typescript_types` ile oluştur

### Yeni ISG Eğitim Alanı
1. Migration: `personel` tablosuna `yeni_alan_tarihi` DATE + `yeni_alan_gecerlilik_suresi` INTEGER
2. `lib/egitim-uyari.ts`: `EGITIM_FIELDS` dizisine ekle
3. `personnel-form.tsx` + `personnel-list.tsx`: Form alanı ve görüntüleme ekle
4. Migration: `ayarlar`'a varsayılan uyarı süresi satırı ekle

## 9. Önemli Notlar

- **TC Kimlik**: 11 hane, numeric, checksum validasyonu, masked display
- **Auth**: Geliştirme aşamasında devre dışı. Public RLS. v1.0.0-public tag'ine dönülebilir.
- **Sidebar sırası**: DB'den okunur (`menu_order_main` / `menu_order_ek`). Yeni öğeler listenin sonuna eklenir.
- **Arşiv**: `personel.arsivde=true` olan kayıtlar. Geri yüklenebilir (`arsivde=false`).
- **Migrasyonlar**: `npx supabase db push` ile uygulanır. Sıra numarası önemlidir.
- **audit_log.action**: CHECK constraint `'INSERT', 'UPDATE', 'DELETE', 'ARCHIVE'` (Migration 028 ile ARCHIVE eklendi)
- **AI Entegrasyonları**: `ayarlar` tablosunda `type='ai'`, `key='ai_entries'` — JSON array olarak saklanır
- **Node.js**: v24.15.0

## 10. Sık Kullanılan Komutlar

```bash
npm run dev          # Geliştirme sunucusu
npx tsc --noEmit     # TypeScript kontrol
npx supabase db push # Migration uygula
npm run build        # Production build
git tag vX.Y.Z       # Sürüm tag'ı
```
