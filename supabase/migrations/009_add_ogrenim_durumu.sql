-- Personel tablosuna ogrenim_durumu kolonu ekle
ALTER TABLE personel ADD COLUMN IF NOT EXISTS ogrenim_durumu text;
