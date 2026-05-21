-- İhtar Dosyaları RLS Politikaları (Public - Geliştirme Aşaması)

DROP POLICY IF EXISTS "Herkes okuyabilir" ON ihtar_dosyalari;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON ihtar_dosyalari;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON ihtar_dosyalari;
DROP POLICY IF EXISTS "Herkes silebilir" ON ihtar_dosyalari;

CREATE POLICY "Herkes okuyabilir" ON ihtar_dosyalari FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON ihtar_dosyalari FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON ihtar_dosyalari FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON ihtar_dosyalari FOR DELETE USING (true);
