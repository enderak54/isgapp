CREATE TABLE IF NOT EXISTS ohs_hedefleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hedef_adi TEXT NOT NULL,
  aciklama TEXT,
  kpi TEXT,
  hedef_deger NUMERIC,
  mevcut_deger NUMERIC,
  birim TEXT,
  baslangic_tarihi DATE,
  hedef_tarih DATE,
  sorumlu TEXT,
  durum TEXT NOT NULL DEFAULT 'devam' CHECK (durum IN ('devam', 'tamamlandi', 'iptal')),
  olusturma_tarihi TIMESTAMPTZ DEFAULT now(),
  guncelleme_tarihi TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ohs_hedefleri ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON ohs_hedefleri;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON ohs_hedefleri;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON ohs_hedefleri;
DROP POLICY IF EXISTS "Herkes silebilir" ON ohs_hedefleri;
CREATE POLICY "Herkes okuyabilir" ON ohs_hedefleri FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON ohs_hedefleri FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON ohs_hedefleri FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON ohs_hedefleri FOR DELETE USING (true);
