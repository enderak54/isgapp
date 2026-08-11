-- ============================================================
-- ISGAPP SELF-HOST STORAGE SETUP
-- ============================================================
-- storage.buckets / storage.objects tabloları db init sırasında
-- YOKTUR; bunları storage-api servisi ayağa kalkınca oluşturur.
-- Bu script setup.sh tarafından, stack ayağa kalktıktan ve
-- storage şeması hazır olduktan SONRA uygulanır (idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- 1) STORAGE BUCKETS (isgapp bucket'ları, public=true, limitsiz)
--    Not: `kamera` bucket'ı kolla modülüne ait olduğundan dahil edilmedi.
-- ------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('ihtar-dosyalari', 'ihtar-dosyalari', TRUE, NULL, NULL),
  ('personel-belgeleri', 'personel-belgeleri', TRUE, NULL, NULL),
  ('egitim-dosyalari', 'egitim-dosyalari', TRUE, NULL, NULL),
  ('ekipman-dosyalari', 'ekipman-dosyalari', TRUE, NULL, NULL),
  ('kaza-dosyalari', 'kaza-dosyalari', TRUE, NULL, NULL),
  ('santiye-dosyalari', 'santiye-dosyalari', TRUE, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------
-- 2) STORAGE.OBJECTS RLS POLICY'LERİ (canlı DB'deki ile birebir)
--    Kamera dışındaki tüm isgapp bucket'ları — herkes erişebilir (public dev modu)
-- ------------------------------------------------------------

-- ihtar-dosyalari
DROP POLICY IF EXISTS "Herkes ihtar dosyalarını okuyabilir" ON storage.objects;
CREATE POLICY "Herkes ihtar dosyalarını okuyabilir" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'ihtar-dosyalari');
DROP POLICY IF EXISTS "Herkes ihtar dosyası güncelleyebilir" ON storage.objects;
CREATE POLICY "Herkes ihtar dosyası güncelleyebilir" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'ihtar-dosyalari');
DROP POLICY IF EXISTS "Herkes ihtar dosyası silebilir" ON storage.objects;
CREATE POLICY "Herkes ihtar dosyası silebilir" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'ihtar-dosyalari');
DROP POLICY IF EXISTS "Herkes ihtar dosyası yükleyebilir" ON storage.objects;
CREATE POLICY "Herkes ihtar dosyası yükleyebilir" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'ihtar-dosyalari');

-- personel-belgeleri
DROP POLICY IF EXISTS "Herkes personel belgelerini okuyabilir" ON storage.objects;
CREATE POLICY "Herkes personel belgelerini okuyabilir" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'personel-belgeleri');
DROP POLICY IF EXISTS "Herkes personel belgesi güncelleyebilir" ON storage.objects;
CREATE POLICY "Herkes personel belgesi güncelleyebilir" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'personel-belgeleri');
DROP POLICY IF EXISTS "Herkes personel belgesi silebilir" ON storage.objects;
CREATE POLICY "Herkes personel belgesi silebilir" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'personel-belgeleri');
DROP POLICY IF EXISTS "Herkes personel belgesi yükleyebilir" ON storage.objects;
CREATE POLICY "Herkes personel belgesi yükleyebilir" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'personel-belgeleri');

-- egitim-dosyalari
DROP POLICY IF EXISTS "egitim_dosyalari_public_select" ON storage.objects;
CREATE POLICY "egitim_dosyalari_public_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'egitim-dosyalari');
DROP POLICY IF EXISTS "egitim_dosyalari_public_insert" ON storage.objects;
CREATE POLICY "egitim_dosyalari_public_insert" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'egitim-dosyalari');
DROP POLICY IF EXISTS "egitim_dosyalari_public_update" ON storage.objects;
CREATE POLICY "egitim_dosyalari_public_update" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'egitim-dosyalari') WITH CHECK (bucket_id = 'egitim-dosyalari');
DROP POLICY IF EXISTS "egitim_dosyalari_public_delete" ON storage.objects;
CREATE POLICY "egitim_dosyalari_public_delete" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'egitim-dosyalari');

-- ekipman-dosyalari
DROP POLICY IF EXISTS "ekipman_dosyalari_public_select" ON storage.objects;
CREATE POLICY "ekipman_dosyalari_public_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'ekipman-dosyalari');
DROP POLICY IF EXISTS "ekipman_dosyalari_public_insert" ON storage.objects;
CREATE POLICY "ekipman_dosyalari_public_insert" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'ekipman-dosyalari');
DROP POLICY IF EXISTS "ekipman_dosyalari_public_update" ON storage.objects;
CREATE POLICY "ekipman_dosyalari_public_update" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'ekipman-dosyalari') WITH CHECK (bucket_id = 'ekipman-dosyalari');
DROP POLICY IF EXISTS "ekipman_dosyalari_public_delete" ON storage.objects;
CREATE POLICY "ekipman_dosyalari_public_delete" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'ekipman-dosyalari');

-- kaza-dosyalari
DROP POLICY IF EXISTS "kaza_dosyalari_public_select" ON storage.objects;
CREATE POLICY "kaza_dosyalari_public_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'kaza-dosyalari');
DROP POLICY IF EXISTS "kaza_dosyalari_public_insert" ON storage.objects;
CREATE POLICY "kaza_dosyalari_public_insert" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'kaza-dosyalari');
DROP POLICY IF EXISTS "kaza_dosyalari_public_update" ON storage.objects;
CREATE POLICY "kaza_dosyalari_public_update" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'kaza-dosyalari') WITH CHECK (bucket_id = 'kaza-dosyalari');
DROP POLICY IF EXISTS "kaza_dosyalari_public_delete" ON storage.objects;
CREATE POLICY "kaza_dosyalari_public_delete" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'kaza-dosyalari');

-- santiye-dosyalari
DROP POLICY IF EXISTS "santiye_dosyalari_public_select" ON storage.objects;
CREATE POLICY "santiye_dosyalari_public_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'santiye-dosyalari');
DROP POLICY IF EXISTS "santiye_dosyalari_public_insert" ON storage.objects;
CREATE POLICY "santiye_dosyalari_public_insert" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'santiye-dosyalari');
DROP POLICY IF EXISTS "santiye_dosyalari_public_update" ON storage.objects;
CREATE POLICY "santiye_dosyalari_public_update" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'santiye-dosyalari') WITH CHECK (bucket_id = 'santiye-dosyalari');
DROP POLICY IF EXISTS "santiye_dosyalari_public_delete" ON storage.objects;
CREATE POLICY "santiye_dosyalari_public_delete" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'santiye-dosyalari');

-- ------------------------------------------------------------
-- 3) STORAGE GRANT'LARI (canlı DB'deki ACL ile birebir)
-- ------------------------------------------------------------

GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;
