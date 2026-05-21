-- Add SGK Tarihi and Sertifika columns to personel table

ALTER TABLE personel ADD COLUMN IF NOT EXISTS sgk_tarihi DATE;
ALTER TABLE personel ADD COLUMN IF NOT EXISTS sertifika VARCHAR(100);
ALTER TABLE personel ADD COLUMN IF NOT EXISTS sertifika_tarihi DATE;
