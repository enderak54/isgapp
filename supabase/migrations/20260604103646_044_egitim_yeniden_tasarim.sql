-- Eğitim tanımları (ön tanımlı eğitim adları)
CREATE TABLE IF NOT EXISTS egitim_tanimlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Eğitmen tanımları (ön tanımlı eğitmenler)
CREATE TABLE IF NOT EXISTS egitmen_tanimlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,
  iletisim TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Eğitim kayıtları (ana tablo)
CREATE TABLE IF NOT EXISTS egitim_kayitlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanim_id UUID REFERENCES egitim_tanimlari(id) ON DELETE SET NULL,
  egitim_adi_manuel TEXT,
  egitmen_id UUID REFERENCES egitmen_tanimlari(id) ON DELETE SET NULL,
  egitmen_manuel TEXT,
  tarih DATE,
  sure TEXT,
  yer TEXT,
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Eğitim katılımcıları (personel bağlantısı)
CREATE TABLE IF NOT EXISTS egitim_katilimcilar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  egitim_kaydi_id UUID NOT NULL REFERENCES egitim_kayitlari(id) ON DELETE CASCADE,
  personel_id UUID REFERENCES personel(id) ON DELETE SET NULL,
  katilimci_manuel TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_egitim_katilimcilar_kaydi ON egitim_katilimcilar(egitim_kaydi_id);
CREATE INDEX IF NOT EXISTS idx_egitim_katilimcilar_personel ON egitim_katilimcilar(personel_id);

-- RLS (public erişim devam)
ALTER TABLE egitim_tanimlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE egitmen_tanimlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE egitim_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE egitim_katilimcilar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_all" ON egitim_tanimlari;
CREATE POLICY "public_all" ON egitim_tanimlari FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_all" ON egitmen_tanimlari;
CREATE POLICY "public_all" ON egitmen_tanimlari FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_all" ON egitim_kayitlari;
CREATE POLICY "public_all" ON egitim_kayitlari FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_all" ON egitim_katilimcilar;
CREATE POLICY "public_all" ON egitim_katilimcilar FOR ALL USING (true) WITH CHECK (true);
