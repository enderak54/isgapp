# Dağıtım Kılavuzu

## İlk Kurulum

```bash
git clone https://github.com/enderak54/isgapp
cd isgapp
npm install
```

### Ortam Değişkenleri (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://wnbrltpughawrvdmeqhk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_ACCESS_TOKEN=<admin-token>
```

### Veritabanı

```bash
npx supabase login
npx supabase link --project-ref wnbrltpughawrvdmeqhk
npx supabase db push
```

Mevcut migrasyonlar `supabase/migrations/001_*` → `028_*` sırasıyla uygulanır.

## Geliştirme

```bash
npm run dev        # http://localhost:3000
npx tsc --noEmit   # TypeScript kontrolü
```

## Dağıtım (Vercel)

1. GitHub repo'yu Vercel'e bağla
2. Environment variables gir: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy (otomatik, `main` branch'e push ile tetiklenir)

**Canlı**: https://isgapp-psi.vercel.app

## Sürüm Yönetimi

```bash
# Yeni sürüm
npm version patch  # v1.1.0 → v1.1.1 (minor / major)
git push --tags

# GitHub Release
gh release create v1.x.x --title "v1.x.x" --notes "Sürüm notları..."
```

## Migration İşlemleri

```bash
# Yeni migration oluştur
# 1. supabase/migrations/XXX_aciklama.sql dosyası oluştur
# 2. SQL içeriğini yaz
# 3. Uygula:
npx supabase db push

# Migration durumu:
npx supabase migration list

# Sorun giderme (migration çakışması):
npx supabase migration repair --status reverted <version>
npx supabase migration repair --status applied <version>
```

## Önemli Bağımlılıklar

- Node.js v24.x
- Supabase CLI v1.x (şu anki)
- Next.js (App Router)
- Tailwind CSS
- Lucide React (ikonlar)
- `@supabase/supabase-js` (DB istemcisi)
- `@supabase/ssr` (oturum yönetimi — hazır, kullanımda değil)

## Proje Yapısı

```
isgapp/
├── app/           # Next.js App Router sayfaları
├── components/    # React bileşenleri (client components)
├── lib/           # Paylaşılan kütüphaneler
│   ├── supabase.ts     # Supabase client
│   ├── security.ts     # XSS, TC, rate-limit, şifreleme
│   ├── audit.ts        # CRUD audit logging
│   ├── file-validation.ts
│   ├── egitim-uyari.ts # ISG eğitim bitiş hesapları
│   ├── tarih.ts        # Tarih formatlama (gg.aa.yyyy)
│   └── use-idle-timeout.ts
├── supabase/
│   └── migrations/ # Veritabanı migrasyonları
└── middleware.ts   # CSP nonce + güvenlik başlıkları
```
