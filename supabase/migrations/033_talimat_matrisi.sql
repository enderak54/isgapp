-- Personel Talimat Matrisi tablosu
CREATE TABLE IF NOT EXISTS personel_talimat_matrisi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personel_id UUID REFERENCES personel(id) ON DELETE CASCADE,
  talimat_adi VARCHAR(200) NOT NULL,
  tarih DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(personel_id, talimat_adi)
);
