CREATE TABLE IF NOT EXISTS egitim_yer_tanimlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE egitim_yer_tanimlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all" ON egitim_yer_tanimlari;
CREATE POLICY "public_all" ON egitim_yer_tanimlari FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE egitim_kayitlari ADD COLUMN IF NOT EXISTS yer_id UUID REFERENCES egitim_yer_tanimlari(id) ON DELETE SET NULL;
