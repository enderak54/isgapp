CREATE TABLE IF NOT EXISTS isci_katilimi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tur TEXT NOT NULL CHECK (tur IN ('komite_toplandi', 'calisan_danismasi', 'anket', 'oneri')),
  baslik TEXT NOT NULL,
  aciklama TEXT,
  tarih DATE,
  katilimcilar TEXT,
  sonuclar TEXT,
  durum TEXT NOT NULL DEFAULT 'planlandi' CHECK (durum IN ('planlandi', 'gerceklesti', 'iptal')),
  olusturma_tarihi TIMESTAMPTZ DEFAULT now(),
  guncelleme_tarihi TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE isci_katilimi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON isci_katilimi;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON isci_katilimi;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON isci_katilimi;
DROP POLICY IF EXISTS "Herkes silebilir" ON isci_katilimi;
CREATE POLICY "Herkes okuyabilir" ON isci_katilimi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON isci_katilimi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON isci_katilimi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON isci_katilimi FOR DELETE USING (true);
