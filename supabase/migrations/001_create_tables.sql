-- Personel tablosu
CREATE TABLE IF NOT EXISTS personel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kimlik_no VARCHAR(11) UNIQUE NOT NULL,
  ad_soyad VARCHAR(100),
  ise_giris_tarihi DATE,
  meslek_kodu VARCHAR(50),
  telefon VARCHAR(20),
  email VARCHAR(100),
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

-- Şantiyeler tablosu
CREATE TABLE IF NOT EXISTS santiyeler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad VARCHAR(100) NOT NULL,
  adres TEXT,
  sorumlu VARCHAR(100),
  telefon VARCHAR(20),
  baslangic_tarihi DATE,
  bitis_tarihi DATE,
  durum VARCHAR(20) DEFAULT 'aktif',
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İş Ekipmanları tablosu
CREATE TABLE IF NOT EXISTS is_ekipmanlari (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad VARCHAR(100) NOT NULL,
  seri_no VARCHAR(50),
  tip VARCHAR(50),
  santiye_id UUID REFERENCES santiyeler(id),
  son_kontrol_tarihi DATE,
  sonraki_kontrol_tarihi DATE,
  durum VARCHAR(20) DEFAULT 'aktif',
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MYK Belgeleri tablosu
CREATE TABLE IF NOT EXISTS myk_belgeri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personel_id UUID REFERENCES personel(id) ON DELETE CASCADE,
  belge_adi VARCHAR(100) NOT NULL,
  belge_no VARCHAR(50),
  alis_tarihi DATE,
  gecerlilik_tarihi DATE,
  durum VARCHAR(20) DEFAULT 'gecerli',
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operatör Belgeleri tablosu
CREATE TABLE IF NOT EXISTS operator_belgeri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personel_id UUID REFERENCES personel(id) ON DELETE CASCADE,
  belge_adi VARCHAR(100) NOT NULL,
  belge_no VARCHAR(50),
  alis_tarihi DATE,
  gecerlilik_tarihi DATE,
  durum VARCHAR(20) DEFAULT 'gecerli',
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Taşeronlar tablosu
CREATE TABLE IF NOT EXISTS taseronlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firma_adi VARCHAR(100) NOT NULL,
  yetkili VARCHAR(100),
  telefon VARCHAR(20),
  email VARCHAR(100),
  adres TEXT,
  vergi_no VARCHAR(20),
  santiye_id UUID REFERENCES santiyeler(id),
  durum VARCHAR(20) DEFAULT 'aktif',
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saha Sorumluları tablosu
CREATE TABLE IF NOT EXISTS saha_sorumlulari (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_soyad VARCHAR(100) NOT NULL,
  telefon VARCHAR(20),
  email VARCHAR(100),
  pozisyon VARCHAR(50),
  santiye_id UUID REFERENCES santiyeler(id),
  durum VARCHAR(20) DEFAULT 'aktif',
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İş Kazaları tablosu
CREATE TABLE IF NOT EXISTS is_kazalari (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personel_id UUID REFERENCES personel(id),
  tarih DATE NOT NULL,
  saat TIME,
  yer VARCHAR(100),
  aciklama TEXT,
  yaralanma_durumu VARCHAR(50),
  hastane VARCHAR(100),
  rapor_no VARCHAR(50),
  onleyici_onlemler TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eğitimler tablosu
CREATE TABLE IF NOT EXISTS egitimler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad VARCHAR(100) NOT NULL,
  tarih DATE,
  sure VARCHAR(20),
  egitmen VARCHAR(100),
  yer VARCHAR(100),
  katilimcilar TEXT,
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Talimatlar tablosu
CREATE TABLE IF NOT EXISTS talimatlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  baslik VARCHAR(100) NOT NULL,
  icerik TEXT,
  tarih DATE,
  hedef VARCHAR(50),
  durum VARCHAR(20) DEFAULT 'aktif',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personel Dosyası (ek belgeler)
CREATE TABLE IF NOT EXISTS personel_dosyasi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personel_id UUID REFERENCES personel(id) ON DELETE CASCADE,
  belge_adi VARCHAR(100) NOT NULL,
  belge_turu VARCHAR(50),
  tarih DATE,
  dosya_url TEXT,
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Politikaları - Personel
ALTER TABLE personel ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON personel;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON personel;
DROP POLICY IF EXISTS "Herkes güncelleyebilir" ON personel;
DROP POLICY IF EXISTS "Herkes silebilir" ON personel;
CREATE POLICY "Herkes okuyabilir" ON personel FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON personel FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON personel FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON personel FOR DELETE USING (true);

-- RLS Politikaları - Şantiyeler
ALTER TABLE santiyeler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON santiyeler FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON santiyeler FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON santiyeler FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON santiyeler FOR DELETE USING (true);

-- RLS Politikaları - İş Ekipmanları
ALTER TABLE is_ekipmanlari ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON is_ekipmanlari FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON is_ekipmanlari FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON is_ekipmanlari FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON is_ekipmanlari FOR DELETE USING (true);

-- RLS Politikaları - MYK Belgeleri
ALTER TABLE myk_belgeri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON myk_belgeri FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON myk_belgeri FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON myk_belgeri FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON myk_belgeri FOR DELETE USING (true);

-- RLS Politikaları - Operatör Belgeleri
ALTER TABLE operator_belgeri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON operator_belgeri FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON operator_belgeri FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON operator_belgeri FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON operator_belgeri FOR DELETE USING (true);

-- RLS Politikaları - Taşeronlar
ALTER TABLE taseronlar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON taseronlar FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON taseronlar FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON taseronlar FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON taseronlar FOR DELETE USING (true);

-- RLS Politikaları - Saha Sorumluları
ALTER TABLE saha_sorumlulari ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON saha_sorumlulari FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON saha_sorumlulari FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON saha_sorumlulari FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON saha_sorumlulari FOR DELETE USING (true);

-- RLS Politikaları - İş Kazaları
ALTER TABLE is_kazalari ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON is_kazalari FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON is_kazalari FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON is_kazalari FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON is_kazalari FOR DELETE USING (true);

-- RLS Politikaları - Eğitimler
ALTER TABLE egitimler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON egitimler FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON egitimler FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON egitimler FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON egitimler FOR DELETE USING (true);

-- RLS Politikaları - Talimatlar
ALTER TABLE talimatlar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON talimatlar FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON talimatlar FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON talimatlar FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON talimatlar FOR DELETE USING (true);

-- RLS Politikaları - Personel Dosyası
ALTER TABLE personel_dosyasi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON personel_dosyasi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON personel_dosyasi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON personel_dosyasi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON personel_dosyasi FOR DELETE USING (true);
