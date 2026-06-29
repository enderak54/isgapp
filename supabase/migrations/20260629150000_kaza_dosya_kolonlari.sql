-- Kaza dosyaları için storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('kaza-dosyalari', 'kaza-dosyalari', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kaza_dosyalari_public_select') THEN
    CREATE POLICY "kaza_dosyalari_public_select" ON storage.objects
      FOR SELECT USING (bucket_id = 'kaza-dosyalari');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kaza_dosyalari_public_insert') THEN
    CREATE POLICY "kaza_dosyalari_public_insert" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'kaza-dosyalari');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kaza_dosyalari_public_update') THEN
    CREATE POLICY "kaza_dosyalari_public_update" ON storage.objects
      FOR UPDATE USING (bucket_id = 'kaza-dosyalari') WITH CHECK (bucket_id = 'kaza-dosyalari');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kaza_dosyalari_public_delete') THEN
    CREATE POLICY "kaza_dosyalari_public_delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'kaza-dosyalari');
  END IF;
END $$;

-- İş Kazaları tablosuna dosya URL kolonları
ALTER TABLE is_kazalari
  ADD COLUMN IF NOT EXISTS kaza_tutanagi_dosyasi TEXT,
  ADD COLUMN IF NOT EXISTS kaza_bildirim_dosyasi TEXT,
  ADD COLUMN IF NOT EXISTS ise_donus_egitimi_dosyasi TEXT,
  ADD COLUMN IF NOT EXISTS rapor_dosyasi TEXT;
