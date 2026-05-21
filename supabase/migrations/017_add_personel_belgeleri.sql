-- Personel Belgeleri tablosu
CREATE TABLE IF NOT EXISTS personel_belgeleri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personel_id uuid REFERENCES personel(id) ON DELETE CASCADE,
  belge_tipi text NOT NULL CHECK (belge_tipi IN ('isg_egitim', 'yuksekte_calisma', 'myk', 'operator_belgesi', 'kkd', 'oryantasyon', 'saglik_raporu', 'diger')),
  dosya_url text NOT NULL,
  dosya_adi text NOT NULL,
  dosya_uzantisi text,
  dosya_boyut int,
  aciklama text,
  eklenme_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now(),
  silinme_tarihi timestamptz
);

-- Personel Belgeleri RLS Politikaları (Public - Geliştirme Aşaması)
DROP POLICY IF EXISTS "Herkes okuyabilir" ON personel_belgeleri;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON personel_belgeleri;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON personel_belgeleri;
DROP POLICY IF EXISTS "Herkes silebilir" ON personel_belgeleri;

CREATE POLICY "Herkes okuyabilir" ON personel_belgeleri FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON personel_belgeleri FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON personel_belgeleri FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON personel_belgeleri FOR DELETE USING (true);
