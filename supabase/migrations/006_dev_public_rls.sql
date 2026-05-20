-- Geliştirme aşaması için RLS politikalarını public yap
-- Auth kurulunca 005_auth_rls.sql tekrar çalıştırılabilir

-- personel
DROP POLICY IF EXISTS "personel_select" ON personel;
DROP POLICY IF EXISTS "personel_insert" ON personel;
DROP POLICY IF EXISTS "personel_update" ON personel;
DROP POLICY IF EXISTS "personel_delete" ON personel;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON personel;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON personel;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON personel;
DROP POLICY IF EXISTS "Herkes silebilir" ON personel;
CREATE POLICY "Herkes okuyabilir" ON personel FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON personel FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON personel FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON personel FOR DELETE USING (true);

-- santiyeler
DROP POLICY IF EXISTS "santiyeler_select" ON santiyeler;
DROP POLICY IF EXISTS "santiyeler_insert" ON santiyeler;
DROP POLICY IF EXISTS "santiyeler_update" ON santiyeler;
DROP POLICY IF EXISTS "santiyeler_delete" ON santiyeler;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON santiyeler;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON santiyeler;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON santiyeler;
DROP POLICY IF EXISTS "Herkes silebilir" ON santiyeler;
CREATE POLICY "Herkes okuyabilir" ON santiyeler FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON santiyeler FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON santiyeler FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON santiyeler FOR DELETE USING (true);

-- is_ekipmanlari
DROP POLICY IF EXISTS "is_ekipmanlari_select" ON is_ekipmanlari;
DROP POLICY IF EXISTS "is_ekipmanlari_insert" ON is_ekipmanlari;
DROP POLICY IF EXISTS "is_ekipmanlari_update" ON is_ekipmanlari;
DROP POLICY IF EXISTS "is_ekipmanlari_delete" ON is_ekipmanlari;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON is_ekipmanlari;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON is_ekipmanlari;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON is_ekipmanlari;
DROP POLICY IF EXISTS "Herkes silebilir" ON is_ekipmanlari;
CREATE POLICY "Herkes okuyabilir" ON is_ekipmanlari FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON is_ekipmanlari FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON is_ekipmanlari FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON is_ekipmanlari FOR DELETE USING (true);

-- myk_belgeri
DROP POLICY IF EXISTS "myk_belgeri_select" ON myk_belgeri;
DROP POLICY IF EXISTS "myk_belgeri_insert" ON myk_belgeri;
DROP POLICY IF EXISTS "myk_belgeri_update" ON myk_belgeri;
DROP POLICY IF EXISTS "myk_belgeri_delete" ON myk_belgeri;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON myk_belgeri;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON myk_belgeri;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON myk_belgeri;
DROP POLICY IF EXISTS "Herkes silebilir" ON myk_belgeri;
CREATE POLICY "Herkes okuyabilir" ON myk_belgeri FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON myk_belgeri FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON myk_belgeri FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON myk_belgeri FOR DELETE USING (true);

-- operator_belgeri
DROP POLICY IF EXISTS "operator_belgeri_select" ON operator_belgeri;
DROP POLICY IF EXISTS "operator_belgeri_insert" ON operator_belgeri;
DROP POLICY IF EXISTS "operator_belgeri_update" ON operator_belgeri;
DROP POLICY IF EXISTS "operator_belgeri_delete" ON operator_belgeri;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON operator_belgeri;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON operator_belgeri;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON operator_belgeri;
DROP POLICY IF EXISTS "Herkes silebilir" ON operator_belgeri;
CREATE POLICY "Herkes okuyabilir" ON operator_belgeri FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON operator_belgeri FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON operator_belgeri FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON operator_belgeri FOR DELETE USING (true);

-- taseronlar
DROP POLICY IF EXISTS "taseronlar_select" ON taseronlar;
DROP POLICY IF EXISTS "taseronlar_insert" ON taseronlar;
DROP POLICY IF EXISTS "taseronlar_update" ON taseronlar;
DROP POLICY IF EXISTS "taseronlar_delete" ON taseronlar;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON taseronlar;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON taseronlar;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON taseronlar;
DROP POLICY IF EXISTS "Herkes silebilir" ON taseronlar;
CREATE POLICY "Herkes okuyabilir" ON taseronlar FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON taseronlar FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON taseronlar FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON taseronlar FOR DELETE USING (true);

-- saha_sorumlulari
DROP POLICY IF EXISTS "saha_sorumlulari_select" ON saha_sorumlulari;
DROP POLICY IF EXISTS "saha_sorumlulari_insert" ON saha_sorumlulari;
DROP POLICY IF EXISTS "saha_sorumlulari_update" ON saha_sorumlulari;
DROP POLICY IF EXISTS "saha_sorumlulari_delete" ON saha_sorumlulari;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON saha_sorumlulari;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON saha_sorumlulari;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON saha_sorumlulari;
DROP POLICY IF EXISTS "Herkes silebilir" ON saha_sorumlulari;
CREATE POLICY "Herkes okuyabilir" ON saha_sorumlulari FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON saha_sorumlulari FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON saha_sorumlulari FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON saha_sorumlulari FOR DELETE USING (true);

-- is_kazalari
DROP POLICY IF EXISTS "is_kazalari_select" ON is_kazalari;
DROP POLICY IF EXISTS "is_kazalari_insert" ON is_kazalari;
DROP POLICY IF EXISTS "is_kazalari_update" ON is_kazalari;
DROP POLICY IF EXISTS "is_kazalari_delete" ON is_kazalari;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON is_kazalari;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON is_kazalari;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON is_kazalari;
DROP POLICY IF EXISTS "Herkes silebilir" ON is_kazalari;
CREATE POLICY "Herkes okuyabilir" ON is_kazalari FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON is_kazalari FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON is_kazalari FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON is_kazalari FOR DELETE USING (true);

-- egitimler
DROP POLICY IF EXISTS "egitimler_select" ON egitimler;
DROP POLICY IF EXISTS "egitimler_insert" ON egitimler;
DROP POLICY IF EXISTS "egitimler_update" ON egitimler;
DROP POLICY IF EXISTS "egitimler_delete" ON egitimler;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON egitimler;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON egitimler;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON egitimler;
DROP POLICY IF EXISTS "Herkes silebilir" ON egitimler;
CREATE POLICY "Herkes okuyabilir" ON egitimler FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON egitimler FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON egitimler FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON egitimler FOR DELETE USING (true);

-- talimatlar
DROP POLICY IF EXISTS "talimatlar_select" ON talimatlar;
DROP POLICY IF EXISTS "talimatlar_insert" ON talimatlar;
DROP POLICY IF EXISTS "talimatlar_update" ON talimatlar;
DROP POLICY IF EXISTS "talimatlar_delete" ON talimatlar;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON talimatlar;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON talimatlar;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON talimatlar;
DROP POLICY IF EXISTS "Herkes silebilir" ON talimatlar;
CREATE POLICY "Herkes okuyabilir" ON talimatlar FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON talimatlar FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON talimatlar FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON talimatlar FOR DELETE USING (true);

-- personel_dosyasi
DROP POLICY IF EXISTS "personel_dosyasi_select" ON personel_dosyasi;
DROP POLICY IF EXISTS "personel_dosyasi_insert" ON personel_dosyasi;
DROP POLICY IF EXISTS "personel_dosyasi_update" ON personel_dosyasi;
DROP POLICY IF EXISTS "personel_dosyasi_delete" ON personel_dosyasi;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON personel_dosyasi;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON personel_dosyasi;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON personel_dosyasi;
DROP POLICY IF EXISTS "Herkes silebilir" ON personel_dosyasi;
CREATE POLICY "Herkes okuyabilir" ON personel_dosyasi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON personel_dosyasi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON personel_dosyasi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON personel_dosyasi FOR DELETE USING (true);

-- ayarlar
DROP POLICY IF EXISTS "ayarlar_select" ON ayarlar;
DROP POLICY IF EXISTS "ayarlar_insert" ON ayarlar;
DROP POLICY IF EXISTS "ayarlar_update" ON ayarlar;
DROP POLICY IF EXISTS "ayarlar_delete" ON ayarlar;
CREATE POLICY "ayarlar_select" ON ayarlar FOR SELECT USING (true);
CREATE POLICY "ayarlar_insert" ON ayarlar FOR INSERT WITH CHECK (true);
CREATE POLICY "ayarlar_update" ON ayarlar FOR UPDATE USING (true);
CREATE POLICY "ayarlar_delete" ON ayarlar FOR DELETE USING (true);
