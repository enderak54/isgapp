-- Personel tablosu oluştur
CREATE TABLE IF NOT EXISTS personel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kimlik_no VARCHAR(11) UNIQUE NOT NULL,
  ad_soyad VARCHAR(100),
  ise_giris_tarihi DATE,
  meslek_kodu VARCHAR(50),
  telefon VARCHAR(20),
  santiye_adi VARCHAR(100),
  ekip_adi VARCHAR(100),
  yuksekte_calisma_tarihi DATE,
  myk_tarihi DATE,
  operator_belgesi_tarihi DATE,
  kkd_tarihi DATE,
  oryantasyon_tarihi DATE,
  kan_grubu VARCHAR(5),
  yuksekte_calisir BOOLEAN DEFAULT false,
  yuksekte_calisamaz BOOLEAN DEFAULT false,
  gece_calisir BOOLEAN DEFAULT false,
  gece_calisamaz BOOLEAN DEFAULT false,
  vardiyali_calisir BOOLEAN DEFAULT false,
  vardiyali_calisamaz BOOLEAN DEFAULT false,
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE personel ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Personel tablosunu herkes okuyabilir"
  ON personel FOR SELECT
  USING (true);

-- Herkes ekleyebilir
CREATE POLICY "Personel tablosuna herkes ekleyebilir"
  ON personel FOR INSERT
  WITH CHECK (true);

-- Herkes güncelleyebilir
CREATE POLICY "Personel tablosunu herkes güncelleyebilir"
  ON personel FOR UPDATE
  USING (true);

-- Herkes silebilir
CREATE POLICY "Personel tablosundan herkes silebilir"
  ON personel FOR DELETE
  USING (true);

-- Notlar tablosu
CREATE TABLE IF NOT EXISTS notlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personel_id UUID REFERENCES personel(id) ON DELETE CASCADE,
  not_metni TEXT,
  sira_no INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notlar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notlar tablosunu herkes okuyabilir"
  ON notlar FOR SELECT
  USING (true);

CREATE POLICY "Notlar tablosuna herkes ekleyebilir"
  ON notlar FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Notlar tablosunu herkes güncelleyebilir"
  ON notlar FOR UPDATE
  USING (true);

CREATE POLICY "Notlar tablosundan herkes silebilir"
  ON notlar FOR DELETE
  USING (true);
