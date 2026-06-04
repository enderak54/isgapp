CREATE TABLE IF NOT EXISTS ekipler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad VARCHAR(100) NOT NULL,
  sorumlu_personel_id UUID REFERENCES personel(id) ON DELETE SET NULL,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE personel ADD COLUMN IF NOT EXISTS ekip_id UUID REFERENCES ekipler(id) ON DELETE SET NULL;

-- Migrate existing ekip_adi values to ekipler table
INSERT INTO ekipler (ad)
SELECT DISTINCT ekip_adi FROM personel
WHERE ekip_adi IS NOT NULL AND ekip_adi != ''
AND ekip_adi NOT IN (SELECT ad FROM ekipler);

-- Update personel.ekip_id based on matching ekip_adi
UPDATE personel p
SET ekip_id = e.id
FROM ekipler e
WHERE p.ekip_adi = e.ad AND p.ekip_id IS NULL;
