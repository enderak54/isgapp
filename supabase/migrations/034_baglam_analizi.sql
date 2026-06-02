CREATE TABLE IF NOT EXISTS baglam_analizi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tur TEXT NOT NULL CHECK (tur IN ('ic_baglam', 'dis_baglam', 'ilgili_taraf')),
  baslik TEXT NOT NULL,
  aciklama TEXT,
  etki_analizi TEXT,
  risk_firsat TEXT CHECK (risk_firsat IN ('risk', 'firsat', 'her_ikisi')),
  olusturma_tarihi TIMESTAMPTZ DEFAULT now(),
  guncelleme_tarihi TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baglam_analizi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON baglam_analizi;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON baglam_analizi;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON baglam_analizi;
DROP POLICY IF EXISTS "Herkes silebilir" ON baglam_analizi;
CREATE POLICY "Herkes okuyabilir" ON baglam_analizi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON baglam_analizi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON baglam_analizi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON baglam_analizi FOR DELETE USING (true);
