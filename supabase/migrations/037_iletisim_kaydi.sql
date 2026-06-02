CREATE TABLE IF NOT EXISTS iletisim_kaydi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tur TEXT NOT NULL CHECK (tur IN ('ic_iletisim', 'dis_iletisim', 'danisma')),
  konu TEXT NOT NULL,
  mesaj_icerik TEXT,
  gonderen TEXT,
  alici TEXT,
  tarih DATE,
  yontem TEXT CHECK (yontem IN ('e_posta', 'toplanti', 'duyuru', 'telefon', 'yazi', 'diger')),
  olusturma_tarihi TIMESTAMPTZ DEFAULT now(),
  guncelleme_tarihi TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE iletisim_kaydi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON iletisim_kaydi;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON iletisim_kaydi;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON iletisim_kaydi;
DROP POLICY IF EXISTS "Herkes silebilir" ON iletisim_kaydi;
CREATE POLICY "Herkes okuyabilir" ON iletisim_kaydi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON iletisim_kaydi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON iletisim_kaydi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON iletisim_kaydi FOR DELETE USING (true);
