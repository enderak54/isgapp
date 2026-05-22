-- MYK standart eğitim listesi
CREATE TABLE IF NOT EXISTS myk_egitim_listesi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad VARCHAR(200) NOT NULL,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE myk_egitim_listesi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON myk_egitim_listesi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON myk_egitim_listesi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON myk_egitim_listesi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON myk_egitim_listesi FOR DELETE USING (true);

-- Personel-MYK eğitim ilişkisi
CREATE TABLE IF NOT EXISTS personel_myk_egitimleri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personel_id UUID REFERENCES personel(id) ON DELETE CASCADE,
  myk_egitim_id UUID REFERENCES myk_egitim_listesi(id) ON DELETE CASCADE,
  alis_tarihi DATE,
  gecerlilik_suresi INTEGER CHECK (gecerlilik_suresi BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(personel_id, myk_egitim_id)
);

ALTER TABLE personel_myk_egitimleri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON personel_myk_egitimleri FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON personel_myk_egitimleri FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON personel_myk_egitimleri FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON personel_myk_egitimleri FOR DELETE USING (true);

-- Varsayılan MYK eğitimleri
INSERT INTO myk_egitim_listesi (ad) VALUES
  ('İş Sağlığı ve Güvenliği'),
  ('İş Makineleri Operatörlük'),
  ('Forklift Operatörlük'),
  ('Vinç Operatörlük'),
  ('Kaynakçılık'),
  ('Yüksekte Çalışma'),
  ('Yangın Eğitimi'),
  ('İlk Yardım'),
  ('Tehlikeli İşlerde Çalışma'),
  ('İş Ekipmanları Periyodik Kontrolü');
