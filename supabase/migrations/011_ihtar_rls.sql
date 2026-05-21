-- İhtar Tutanağı RLS Politikaları (Public - Geliştirme Aşaması)

DROP POLICY IF EXISTS "Herkes okuyabilir" ON ihtar_tutanagi;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON ihtar_tutanagi;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON ihtar_tutanagi;
DROP POLICY IF EXISTS "Herkes silebilir" ON ihtar_tutanagi;

CREATE POLICY "Herkes okuyabilir" ON ihtar_tutanagi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON ihtar_tutanagi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON ihtar_tutanagi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON ihtar_tutanagi FOR DELETE USING (true);
