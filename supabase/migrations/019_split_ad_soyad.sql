-- Split ad_soyad into separate ad and soyad columns

-- Add new columns
ALTER TABLE personel ADD COLUMN IF NOT EXISTS ad VARCHAR(50);
ALTER TABLE personel ADD COLUMN IF NOT EXISTS soyad VARCHAR(50);

-- Migrate existing data: split on last space
UPDATE personel SET ad = CASE
  WHEN ad_soyad LIKE '% %' THEN LEFT(ad_soyad, LENGTH(ad_soyad) - POSITION(' ' IN REVERSE(ad_soyad)))
  ELSE ad_soyad
END,
soyad = CASE
  WHEN ad_soyad LIKE '% %' THEN RIGHT(ad_soyad, POSITION(' ' IN REVERSE(ad_soyad)) - 1)
  ELSE ''
END
WHERE ad IS NULL AND ad_soyad IS NOT NULL;

-- Drop old column
ALTER TABLE personel DROP COLUMN IF EXISTS ad_soyad;
