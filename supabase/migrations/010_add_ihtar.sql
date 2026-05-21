-- İhtar Tutanağı tablosu
CREATE TABLE IF NOT EXISTS ihtar_tutanagi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personel_id uuid REFERENCES personel(id) ON DELETE SET NULL,
  ihtar_tipi text DEFAULT 'uyari' CHECK (ihtar_tipi IN ('yazili', 'kesin', 'uyari', 'kinai')),
  tarih date NOT NULL,
  yer text,
  konu text NOT NULL,
  aciklama text,
  dayanak_madde text,
  teblig_tarihi date,
  personel_gorusu text,
  durum text DEFAULT 'duzenlendi' CHECK (durum IN ('duzenlendi', 'teblig edildi', 'itiraz var', 'kapatildi')),
  olusturma_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now()
);
