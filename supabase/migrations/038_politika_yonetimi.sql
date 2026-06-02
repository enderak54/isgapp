CREATE TABLE IF NOT EXISTS politika_yonetimi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baslik TEXT NOT NULL,
  politika_metni TEXT,
  versiyon TEXT DEFAULT '1.0',
  onay_tarihi DATE,
  gecerlilik_tarihi DATE,
  durum TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'gecersiz')),
  onaylayan TEXT,
  olusturma_tarihi TIMESTAMPTZ DEFAULT now(),
  guncelleme_tarihi TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE politika_yonetimi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON politika_yonetimi;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON politika_yonetimi;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON politika_yonetimi;
DROP POLICY IF EXISTS "Herkes silebilir" ON politika_yonetimi;
CREATE POLICY "Herkes okuyabilir" ON politika_yonetimi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON politika_yonetimi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON politika_yonetimi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON politika_yonetimi FOR DELETE USING (true);
