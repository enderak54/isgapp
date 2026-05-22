ALTER TABLE personel ADD COLUMN IF NOT EXISTS arsivde BOOLEAN DEFAULT false;
ALTER TABLE personel ADD COLUMN IF NOT EXISTS ayrilis_tarihi DATE;
ALTER TABLE personel ADD COLUMN IF NOT EXISTS ayrilis_nedeni TEXT CHECK (ayrilis_nedeni IN ('istirak_ayrilis', 'hatali_kayit'));
