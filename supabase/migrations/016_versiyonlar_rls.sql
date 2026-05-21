-- Versiyonlar RLS Politikaları (Public - Geliştirme Aşaması)

DROP POLICY IF EXISTS "Herkes okuyabilir" ON versiyonlar;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON versiyonlar;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON versiyonlar;
DROP POLICY IF EXISTS "Herkes silebilir" ON versiyonlar;

CREATE POLICY "Herkes okuyabilir" ON versiyonlar FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON versiyonlar FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON versiyonlar FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON versiyonlar FOR DELETE USING (true);
