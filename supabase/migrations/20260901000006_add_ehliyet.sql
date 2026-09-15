-- Ehliyet bilgileri icin personel tablosuna alanlar (zorunlu degil, ayarlar uzerinden zorunlu yapilabilir)
ALTER TABLE public.personel ADD COLUMN IF NOT EXISTS ehliyet_no text;
ALTER TABLE public.personel ADD COLUMN IF NOT EXISTS ehliyet_sinifi text;
ALTER TABLE public.personel ADD COLUMN IF NOT EXISTS ehliyet_tarihi date;
