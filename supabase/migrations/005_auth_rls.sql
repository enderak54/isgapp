-- Auth tabanlı RLS politikaları
-- Tüm tablolarda okuma/yazma için auth gerektirilir

-- personel
DROP POLICY IF EXISTS "Herkes okuyabilir" ON personel;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON personel;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON personel;
DROP POLICY IF EXISTS "Herkes silebilir" ON personel;
CREATE POLICY "personel_select" ON personel FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "personel_insert" ON personel FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "personel_update" ON personel FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "personel_delete" ON personel FOR DELETE USING (auth.role() = 'authenticated');

-- santiyeler
DROP POLICY IF EXISTS "Herkes okuyabilir" ON santiyeler;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON santiyeler;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON santiyeler;
DROP POLICY IF EXISTS "Herkes silebilir" ON santiyeler;
CREATE POLICY "santiyeler_select" ON santiyeler FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "santiyeler_insert" ON santiyeler FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "santiyeler_update" ON santiyeler FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "santiyeler_delete" ON santiyeler FOR DELETE USING (auth.role() = 'authenticated');

-- is_ekipmanlari
DROP POLICY IF EXISTS "Herkes okuyabilir" ON is_ekipmanlari;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON is_ekipmanlari;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON is_ekipmanlari;
DROP POLICY IF EXISTS "Herkes silebilir" ON is_ekipmanlari;
CREATE POLICY "is_ekipmanlari_select" ON is_ekipmanlari FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "is_ekipmanlari_insert" ON is_ekipmanlari FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "is_ekipmanlari_update" ON is_ekipmanlari FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "is_ekipmanlari_delete" ON is_ekipmanlari FOR DELETE USING (auth.role() = 'authenticated');

-- myk_belgeri
DROP POLICY IF EXISTS "Herkes okuyabilir" ON myk_belgeri;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON myk_belgeri;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON myk_belgeri;
DROP POLICY IF EXISTS "Herkes silebilir" ON myk_belgeri;
CREATE POLICY "myk_belgeri_select" ON myk_belgeri FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "myk_belgeri_insert" ON myk_belgeri FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "myk_belgeri_update" ON myk_belgeri FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "myk_belgeri_delete" ON myk_belgeri FOR DELETE USING (auth.role() = 'authenticated');

-- operator_belgeri
DROP POLICY IF EXISTS "Herkes okuyabilir" ON operator_belgeri;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON operator_belgeri;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON operator_belgeri;
DROP POLICY IF EXISTS "Herkes silebilir" ON operator_belgeri;
CREATE POLICY "operator_belgeri_select" ON operator_belgeri FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "operator_belgeri_insert" ON operator_belgeri FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "operator_belgeri_update" ON operator_belgeri FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "operator_belgeri_delete" ON operator_belgeri FOR DELETE USING (auth.role() = 'authenticated');

-- taseronlar
DROP POLICY IF EXISTS "Herkes okuyabilir" ON taseronlar;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON taseronlar;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON taseronlar;
DROP POLICY IF EXISTS "Herkes silebilir" ON taseronlar;
CREATE POLICY "taseronlar_select" ON taseronlar FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "taseronlar_insert" ON taseronlar FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "taseronlar_update" ON taseronlar FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "taseronlar_delete" ON taseronlar FOR DELETE USING (auth.role() = 'authenticated');

-- saha_sorumlulari
DROP POLICY IF EXISTS "Herkes okuyabilir" ON saha_sorumlulari;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON saha_sorumlulari;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON saha_sorumlulari;
DROP POLICY IF EXISTS "Herkes silebilir" ON saha_sorumlulari;
CREATE POLICY "saha_sorumlulari_select" ON saha_sorumlulari FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "saha_sorumlulari_insert" ON saha_sorumlulari FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "saha_sorumlulari_update" ON saha_sorumlulari FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "saha_sorumlulari_delete" ON saha_sorumlulari FOR DELETE USING (auth.role() = 'authenticated');

-- is_kazalari
DROP POLICY IF EXISTS "Herkes okuyabilir" ON is_kazalari;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON is_kazalari;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON is_kazalari;
DROP POLICY IF EXISTS "Herkes silebilir" ON is_kazalari;
CREATE POLICY "is_kazalari_select" ON is_kazalari FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "is_kazalari_insert" ON is_kazalari FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "is_kazalari_update" ON is_kazalari FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "is_kazalari_delete" ON is_kazalari FOR DELETE USING (auth.role() = 'authenticated');

-- egitimler
DROP POLICY IF EXISTS "Herkes okuyabilir" ON egitimler;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON egitimler;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON egitimler;
DROP POLICY IF EXISTS "Herkes silebilir" ON egitimler;
CREATE POLICY "egitimler_select" ON egitimler FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "egitimler_insert" ON egitimler FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "egitimler_update" ON egitimler FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "egitimler_delete" ON egitimler FOR DELETE USING (auth.role() = 'authenticated');

-- talimatlar
DROP POLICY IF EXISTS "Herkes okuyabilir" ON talimatlar;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON talimatlar;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON talimatlar;
DROP POLICY IF EXISTS "Herkes silebilir" ON talimatlar;
CREATE POLICY "talimatlar_select" ON talimatlar FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "talimatlar_insert" ON talimatlar FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "talimatlar_update" ON talimatlar FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "talimatlar_delete" ON talimatlar FOR DELETE USING (auth.role() = 'authenticated');

-- personel_dosyasi
DROP POLICY IF EXISTS "Herkes okuyabilir" ON personel_dosyasi;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON personel_dosyasi;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON personel_dosyasi;
DROP POLICY IF EXISTS "Herkes silebilir" ON personel_dosyasi;
CREATE POLICY "personel_dosyasi_select" ON personel_dosyasi FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "personel_dosyasi_insert" ON personel_dosyasi FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "personel_dosyasi_update" ON personel_dosyasi FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "personel_dosyasi_delete" ON personel_dosyasi FOR DELETE USING (auth.role() = 'authenticated');

-- ayarlar
DROP POLICY IF EXISTS "ayarlar_select" ON ayarlar;
DROP POLICY IF EXISTS "ayarlar_insert" ON ayarlar;
DROP POLICY IF EXISTS "ayarlar_update" ON ayarlar;
DROP POLICY IF EXISTS "ayarlar_delete" ON ayarlar;
CREATE POLICY "ayarlar_select" ON ayarlar FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ayarlar_insert" ON ayarlar FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "ayarlar_update" ON ayarlar FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "ayarlar_delete" ON ayarlar FOR DELETE USING (auth.role() = 'authenticated');
