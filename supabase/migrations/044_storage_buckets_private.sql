-- Storage buckets private migration
-- Development: still using USING(true) for authenticated-adjacent access
-- Production: switch to auth.role() = 'authenticated' before deploying

UPDATE storage.buckets SET public = false WHERE id IN ('ihtar-dosyalari', 'personel-belgeleri');

DROP POLICY IF EXISTS "Herkes ihtar dosyalarını okuyabilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes ihtar dosyası yükleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes ihtar dosyası güncelleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes ihtar dosyası silebilir" ON storage.objects;

CREATE POLICY "ihtar-dosyalari SELECT" ON storage.objects
  FOR SELECT USING (bucket_id = 'ihtar-dosyalari');

CREATE POLICY "ihtar-dosyalari INSERT" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ihtar-dosyalari');

CREATE POLICY "ihtar-dosyalari UPDATE" ON storage.objects
  FOR UPDATE USING (bucket_id = 'ihtar-dosyalari');

CREATE POLICY "ihtar-dosyalari DELETE" ON storage.objects
  FOR DELETE USING (bucket_id = 'ihtar-dosyalari');

DROP POLICY IF EXISTS "Herkes personel belgelerini okuyabilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes personel belgesi yükleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes personel belgesi güncelleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes personel belgesi silebilir" ON storage.objects;

CREATE POLICY "personel-belgeleri SELECT" ON storage.objects
  FOR SELECT USING (bucket_id = 'personel-belgeleri');

CREATE POLICY "personel-belgeleri INSERT" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'personel-belgeleri');

CREATE POLICY "personel-belgeleri UPDATE" ON storage.objects
  FOR UPDATE USING (bucket_id = 'personel-belgeleri');

CREATE POLICY "personel-belgeleri DELETE" ON storage.objects
  FOR DELETE USING (bucket_id = 'personel-belgeleri');
