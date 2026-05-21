-- İhtar Tutanağı Dosya Ekleri tablosu
CREATE TABLE IF NOT EXISTS ihtar_dosyalari (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ihtar_id uuid REFERENCES ihtar_tutanagi(id) ON DELETE CASCADE,
  dosya_url text NOT NULL,
  dosya_adi text NOT NULL,
  dosya_turu text CHECK (dosya_turu IN ('gorsel', 'belge')),
  dosya_uzantisi text,
  dosya_boyut int,
  neden text,
  eklenme_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now(),
  silinme_tarihi timestamptz
);
