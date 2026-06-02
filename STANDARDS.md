# ISG Takip Projesi — Standartlar ve Convention'lar

## 1. Uluslararası Standartlar

### 1.1 ISO 45001 — İş Sağlığı ve Güvenliği Yönetim Sistemi

| Madde | Modül | Tablo | Durum |
|-------|-------|-------|-------|
| 4.1/4.2 | Bağlam Analizi | `baglam_analizi` | ✅ |
| 5.1 | Politika Yönetimi | `politika_yonetimi` | ✅ |
| 5.4 | İşçi Katılımı | `isci_katilimi` | ✅ |
| 6.1 | Risk Değerlendirme | `risk_degerlendirme` | ✅ |
| 6.2 | OHS Hedefleri | `ohs_hedefleri` | ✅ |
| 7.1 | Doküman Kontrol | `dokuman_kontrol` | ✅ |
| 7.2 | Yetkinlik Matrisi | `yetkinlik_matrisi` | ✅ |
| 7.4 | İletişim Kaydı | `iletisim_kaydi` | ✅ |
| 8.1 | Acil Durum | `acil_durum` | ✅ |
| 9.1 | Performans İzleme | `performans_izleme` | ✅ |
| 9.2 | İç Denetim | `ic_denetim` (+ `denetim_bulgulari`) | ✅ |
| 9.3 | Yönetim Gözden Geçirme | `yonetim_gozden_gecirme` | ✅ |
| 10.1 | Düzeltici Faaliyet | `duzeltici_faaliyet` | ✅ |
| 10.2 | Yasal Uygunluk | `yasal_uygunluk` | ✅ |

> Her ISO 45001 modülünde: migration SQL → component → route → sidebar → settings toggle → backup API etiketi → audit log bulunmalıdır.

### 1.2 ISO 27001 — Bilgi Güvenliği Yönetimi

| Kontrol | Uygulama | Durum |
|---------|----------|-------|
| A.9.1.1 — Erişim kontrol politikası | Auth/RLS (geliştirme modunda public) | 🟡 |
| A.9.4.2 — Güvenli oturum yönetimi | Idle timeout (30 dk) | ✅ |
| A.10.1.1 — Şifreleme politikası | XOR (client-side, production için değil) | 🟡 |
| A.12.4.1 — Olay kaydı | Audit log (`audit_log` tablosu) | 🟡 |
| A.12.6.1 — Güvenlik açığı yönetimi | CSP + rate limiting + XSS sanitizer | ✅ |
| A.13.1.1 — Ağ güvenliği | CSP + security headers | ✅ |
| A.14.2.1 — Güvenli geliştirme | Input sanitizasyonu, try/catch pattern'i | ✅ |
| A.18.1.4 — Gizlilik ve KVKK | TC maskeleme, KVKK onay tablosu | ✅ |

**Legend:** ✅ Tam / 🟡 Kısmi / ❌ Eksik

### 1.3 KVKK (Kişisel Verilerin Korunması Kanunu) — GDPR Eşdeğeri

- **TC Kimlik No:** `maskTC()` ile UI'da maskeleme (`********###` formatında)
- **KVKK Onayı:** `kvkk_consents` tablosunda ayrı ayrı saklanır (işlenmesi, saklanması, paylaşılması, sağlık verisi)
- **Veri minimizasyonu:** Gereksiz kişisel veri toplanmaz
- **Saklama sınırı:** Aktif olmayan personel arşivlenir (silinmez)
- **Aydınlatma metni:** KVKK onay formundan önce gösterilir

---

## 2. Siber Güvenlik Standartları

### 2.1 OWASP Top 10

| # | Risk | Koruma |
|---|------|--------|
| 1 | **Broken Access Control** | RLS aktif ancak public (geliştirme); production'da auth.role() = 'authenticated' |
| 2 | **Cryptographic Failures** | XOR (zayıf, sadece client-side); production'da server-side encryption gerekli |
| 3 | **Injection** | Supabase ORM parametrize; migration script'te dosya adı interpolation'ı var (düşük risk) |
| 4 | **Insecure Design** | Rate limiting (30/dk) + audit log |
| 5 | **Security Misconfiguration** | CSP + security headers (HSTS, XFO, XSS, etc.) |
| 6 | **Vulnerable Components** | `npm audit` düzenli çalıştırılmalı |
| 7 | **Auth Failures** | Auth sistemi devre dışı (public mode) |
| 8 | **Integrity Failures** | Supabase ORM ile veri bütünlüğü |
| 9 | **Logging & Monitoring** | Audit log (18 modülde eksik) |
| 10 | **SSRF** | Düşük risk (external call: GitHub API + Supabase) |

### 2.2 Content Security Policy (CSP)

```txt
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
connect-src 'self' https://*.supabase.co https://api.github.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

> **Not:** `'unsafe-inline'` korundu çünkü Next.js App Router, kendi inline script'lerine nonce eklemez. Nonce altyapısı hazır (`crypto.randomUUID()` + `x-nonce` header) ama aktif değil.

### 2.3 Security Headers (`next.config.ts`)

| Header | Değer |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-DNS-Prefetch-Control` | `off` (middleware) |

**Eksik:** `Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`

### 2.4 Rate Limiting (`middleware.ts`)

- IP bazlı (`x-forwarded-for` veya `x-real-ip`)
- **30 request / 60 saniye** (tüm `/api/` endpoint'leri için, `/api/commits` hariç)
- In-memory Map (sunucu restart'ında sıfırlanır)
- 60 saniyede bir cleanup (`setInterval`)

### 2.5 XSS Koruması (`lib/security.ts`)

`sanitize()`:
1. Null byte (`\0`) temizliği
2. HTML tag silme (`/<[^>]*>/g`)
3. `javascript:`, `vbscript:`, `data:text/html`, `expression()` protokol temizliği
4. Double-encode tespiti (`decodeURIComponent`) + yeniden tarama
5. Maksimum 10.000 karakter

`sanitizeForm()`: Tüm form objesini recursive temizler (string, boolean, number, array, nested object)

**Zayıf yönler:** Regex blacklist yaklaşımı — event handler'lar (`onclick=`, `onload=`, `onerror=`) ayrıca temizlenmez çünkü HTML tag'lar tamamen silinir. `<svg onload=...>` gibi saldırılar HTML tag regex'inden geçer. DOMPurify gibi bir DOM-based sanitizer kullanılması önerilir.

### 2.6 Backup API Auth

- Header: `x-api-key`
- Env variable: `BACKUP_API_KEY`
- **Kritik:** `BACKUP_API_KEY` `.env.local`'da tanımlı değil → tüm istekler 401 alır. Production'da Vercel env ayarlarına eklenmelidir.

---

## 3. Database Standartları

### 3.1 Migration Naming

`[xxx]_[isim].sql` şeklinde sequential ID:
- `001_create_tables.sql`
- `002_fix_ayarlar.sql`
- ...

Her yeni migration, `supabase/migrations/` dizinine eklenir.

### 3.2 RLS Policies

```sql
ALTER TABLE tablo_adi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON tablo_adi;
-- (tüm policy'ler için DROP)
CREATE POLICY "Herkes okuyabilir" ON tablo_adi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON tablo_adi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON tablo_adi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON tablo_adi FOR DELETE USING (true);
```

> **Geliştirme modu:** Herkese açık (`USING true`). Production'a geçerken `auth.role() = 'authenticated'` yapılacak.
> **Her migration'da** `DROP POLICY IF EXISTS` guard'ı zorunlu.

### 3.3 CHECK Constraint Pattern

```sql
tur TEXT CHECK (tur IN ('deger1', 'deger2')) NOT NULL DEFAULT 'deger1',
durum TEXT CHECK (durum IN ('active', 'passive')) NOT NULL DEFAULT 'active'
```

Tüm enum-like alanlarda CHECK constraint kullanılır (ayrı enum type oluşturulmaz).

### 3.4 Timestamp Convention

- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Güncellemelerde `updated_at = NOW()` manuel set edilir (trigger kullanılmaz)

### 3.5 Tablo İsimlendirme

- **Türkçe** ve **snake_case**
- Tekil isim: `personel`, `santiyeler`, `is_kazalari`, `risk_degerlendirme`
- İlişki tabloları: `personel_talimat_matrisi`, `personel_myk_egitimleri`

---

## 4. Kod Standartları

### 4.1 Tarih Formatı (`lib/tarih.ts`)

```typescript
// ISO → UI: "2024-01-15" → "15.01.2024"
export function formatDate(iso: string | null | undefined): string { ... }
export function displayDate(iso: string | null | undefined): string { ... } // null-safe
```

- DB'de: ISO formatı (`DATE` type)
- UI'da: `gg.aa.yyyy` formatı (`displayDate()` ile)
- Input'larda: `type="date"` (tarayıcı native date picker)
- Kalan süre: `kalanSureText()` ile "X gün kaldı" / "Süre doldu"

### 4.2 Audit Log (`lib/audit.ts`)

Her INSERT/UPDATE/DELETE/ARCHIVE işleminde çağrılır:

```typescript
await logAudit("tablo_adi", "INSERT" | "UPDATE" | "DELETE" | "ARCHIVE", recordId, oldValues, newValues);
```

- Hata ana işlemi kırmaz (`catch + console.error`)
- Audit log eklenmiş modüllerde `try/catch` + error display zorunlu

### 4.3 Error Handling Pattern

```typescript
const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

try {
  // işlem
  setEditStatus({ type: "success", message: "İşlem başarılı" });
} catch (e) {
  setEditStatus({ type: "error", message: "Bir hata oluştu" });
} finally {
  setLoading(false);
}
```

- `finally` ile loading state sıfırlanır
- Error banner: `bg-red-50 text-red-700 rounded p-4 mb-4`
- Success banner: `bg-green-50 text-green-700 rounded p-4 mb-4`

### 4.4 Arama Alanı Standardı

```tsx
<div className="card p-4 mb-6">
  <div className="relative">
    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Ara..."
      className="w-full pr-12 p-3 border rounded"
    />
  </div>
</div>
```

### 4.5 Component Structure

```typescript
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeForm } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { displayDate } from "@/lib/tarih";

export function ModuleName() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [editStatus, setEditStatus] = useState<... | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() { ... }
  async function handleSave(form: any) { ... }
  async function handleDelete(id: string) { ... }

  return ( ... );
}
```

### 4.6 Sidebar Entry

Her yeni modül için:
1. `components/sidebar.tsx`'e link ekle (ek modülse `ekModuller` altına)
2. `components/settings.tsx`'e toggle ekle
3. `app/[slug]/page.tsx` route oluştur

### 4.7 Dosya Yükleme (`lib/file-validation.ts`)

```typescript
validateFile(file): { valid: boolean; error?: string }
  - Max 10MB
  - İzinli türler: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX, XLS, XLSX, TXT
  - Double extension kontrolü
sanitizeFileName(name): string
  - Güvenli olmayan karakterleri `_` ile değiştirir
```

---

## 5. Yeni Modül Checklist

Her yeni ISO 45001 modülü eklendiğinde:

- [ ] Migration SQL yaz (`supabase/migrations/`)
- [ ] Tabloda `created_at`, `updated_at` alanları
- [ ] CHECK constraint'ler (enum alanlarda)
- [ ] RLS policies + `DROP POLICY IF EXISTS` guard
- [ ] Component oluştur (`components/[slug].tsx`)
- [ ] `try/catch` + `editStatus` error handling
- [ ] `sanitizeForm()` tüm input'larda
- [ ] `logAudit()` her INSERT/UPDATE/DELETE'de
- [ ] `displayDate()` tüm tarih gösterimlerinde
- [ ] Route oluştur (`app/[slug]/page.tsx`)
- [ ] Sidebar'a ekle (`components/sidebar.tsx`)
- [ ] Settings'e toggle ekle (`components/settings.tsx`)
- [ ] Backup API label ekle (`app/api/backup/route.ts`)
- [ ] Build kontrol (`npm run build`)
- [ ] Varsa audit log kullan
- [ ] ISO 45001 maddesi STANDARDS.md'de güncelle

---

## 6. Güvenlik Açıkları ve Remediation

| # | Açık | Risk | Çözüm |
|---|------|------|-------|
| 1 | RLS public (auth yok) | Yüksek | Production'da auth aktifleştir + RLS policy'leri `auth.role() = 'authenticated'` yap |
| 2 | BACKUP_API_KEY tanımlı değil | Yüksek | Vercel env'e ekle |
| 3 | 18 modülde audit log yok | Orta | Tüm CRUD işlemlerine `logAudit()` ekle |
| 4 | Nonce-CSP çalışmıyor | Orta | Next.js nonce desteği gelene kadar `unsafe-inline` korunacak |
| 5 | Storage bucket'ları public | Yüksek | RLS policy ekle (auth'lu veya signed URL) |
| 6 | Server-side file validation yok | Orta | Server route'larında multipart validation ekle |
| 7 | XOR encryption zayıf | Düşük | Production'da server-side AES/fernet kullan |
| 8 | Eksik COEP/COOP/CORP header | Düşük | `next.config.ts`'e ekle |
| 9 | CSRF koruması yok | Orta | Double-submit cookie veya SameSite=Strict |
| 10 | env'de SUPABASE_ACCESS_TOKEN düz metin | Düşük | GitHub Actions secret kullan |
