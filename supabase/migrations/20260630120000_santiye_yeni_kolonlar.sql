-- Şantiyeler tablosuna yeni kolonlar
ALTER TABLE santiyeler
  ADD COLUMN IF NOT EXISTS sicil_numarasi VARCHAR(100),
  ADD COLUMN IF NOT EXISTS yapilacak_isler TEXT,
  ADD COLUMN IF NOT EXISTS calisan_temsilcisi VARCHAR(200),
  ADD COLUMN IF NOT EXISTS destek_elemani VARCHAR(200),
  ADD COLUMN IF NOT EXISTS acil_durum_ekipleri TEXT,
  ADD COLUMN IF NOT EXISTS is_sozlesme_dosyasi TEXT,
  ADD COLUMN IF NOT EXISTS risk_analizi_dosyasi TEXT,
  ADD COLUMN IF NOT EXISTS acil_durum_plani_dosyasi TEXT,
  ADD COLUMN IF NOT EXISTS tatbikat_dosyasi TEXT,
  ADD COLUMN IF NOT EXISTS yapi_ruhsati_dosyasi TEXT,
  ADD COLUMN IF NOT EXISTS calisan_temsilcisi_dosyasi TEXT,
  ADD COLUMN IF NOT EXISTS destek_elemani_dosyasi TEXT,
  ADD COLUMN IF NOT EXISTS yapilacak_isler_dosyasi TEXT,
  ADD COLUMN IF NOT EXISTS acil_durum_ekipleri_dosyasi TEXT;

-- Santiye dosyaları için storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('santiye-dosyalari', 'santiye-dosyalari', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'santiye_dosyalari_public_select') THEN
    CREATE POLICY "santiye_dosyalari_public_select" ON storage.objects
      FOR SELECT USING (bucket_id = 'santiye-dosyalari');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'santiye_dosyalari_public_insert') THEN
    CREATE POLICY "santiye_dosyalari_public_insert" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'santiye-dosyalari');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'santiye_dosyalari_public_update') THEN
    CREATE POLICY "santiye_dosyalari_public_update" ON storage.objects
      FOR UPDATE USING (bucket_id = 'santiye-dosyalari') WITH CHECK (bucket_id = 'santiye-dosyalari');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'santiye_dosyalari_public_delete') THEN
    CREATE POLICY "santiye_dosyalari_public_delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'santiye-dosyalari');
  END IF;
END $$;
