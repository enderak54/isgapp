-- Personel ekleme formuna dogum tarihi alani
ALTER TABLE public.personel ADD COLUMN IF NOT EXISTS dogum_tarihi date;
