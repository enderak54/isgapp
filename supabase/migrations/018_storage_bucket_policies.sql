-- Storage Bucket Policies (Public - Geliştirme Aşaması)
-- ihtar-dosyalari ve personel-belgeleri bucket'ları için public erişim politikaları

-- ihtar-dosyalari bucket politikaları
INSERT INTO storage.buckets (id, name, public)
VALUES ('ihtar-dosyalari', 'ihtar-dosyalari', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Herkes ihtar dosyalarını okuyabilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes ihtar dosyası yükleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes ihtar dosyası güncelleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes ihtar dosyası silebilir" ON storage.objects;

CREATE POLICY "Herkes ihtar dosyalarını okuyabilir" ON storage.objects
  FOR SELECT USING (bucket_id = 'ihtar-dosyalari');

CREATE POLICY "Herkes ihtar dosyası yükleyebilir" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ihtar-dosyalari');

CREATE POLICY "Herkes ihtar dosyası güncelleyebilir" ON storage.objects
  FOR UPDATE USING (bucket_id = 'ihtar-dosyalari');

CREATE POLICY "Herkes ihtar dosyası silebilir" ON storage.objects
  FOR DELETE USING (bucket_id = 'ihtar-dosyalari');

-- personel-belgeleri bucket politikaları
INSERT INTO storage.buckets (id, name, public)
VALUES ('personel-belgeleri', 'personel-belgeleri', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Herkes personel belgelerini okuyabilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes personel belgesi yükleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes personel belgesi güncelleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Herkes personel belgesi silebilir" ON storage.objects;

CREATE POLICY "Herkes personel belgelerini okuyabilir" ON storage.objects
  FOR SELECT USING (bucket_id = 'personel-belgeleri');

CREATE POLICY "Herkes personel belgesi yükleyebilir" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'personel-belgeleri');

CREATE POLICY "Herkes personel belgesi güncelleyebilir" ON storage.objects
  FOR UPDATE USING (bucket_id = 'personel-belgeleri');

CREATE POLICY "Herkes personel belgesi silebilir" ON storage.objects
  FOR DELETE USING (bucket_id = 'personel-belgeleri');
