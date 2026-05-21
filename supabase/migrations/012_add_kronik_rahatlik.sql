-- Personel tablosuna kronik_rahatlik kolonu ekle
ALTER TABLE personel ADD COLUMN IF NOT EXISTS kronik_rahatlik text;
