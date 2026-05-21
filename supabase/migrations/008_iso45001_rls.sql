-- ISO 45001 Ek Modüller için RLS Politikaları (Public - Geliştirme Aşaması)

-- risk_degerlendirme
DROP POLICY IF EXISTS "Herkes okuyabilir" ON risk_degerlendirme;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON risk_degerlendirme;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON risk_degerlendirme;
DROP POLICY IF EXISTS "Herkes silebilir" ON risk_degerlendirme;
CREATE POLICY "Herkes okuyabilir" ON risk_degerlendirme FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON risk_degerlendirme FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON risk_degerlendirme FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON risk_degerlendirme FOR DELETE USING (true);

-- yasal_uygunluk
DROP POLICY IF EXISTS "Herkes okuyabilir" ON yasal_uygunluk;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON yasal_uygunluk;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON yasal_uygunluk;
DROP POLICY IF EXISTS "Herkes silebilir" ON yasal_uygunluk;
CREATE POLICY "Herkes okuyabilir" ON yasal_uygunluk FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON yasal_uygunluk FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON yasal_uygunluk FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON yasal_uygunluk FOR DELETE USING (true);

-- ic_denetim
DROP POLICY IF EXISTS "Herkes okuyabilir" ON ic_denetim;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON ic_denetim;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON ic_denetim;
DROP POLICY IF EXISTS "Herkes silebilir" ON ic_denetim;
CREATE POLICY "Herkes okuyabilir" ON ic_denetim FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON ic_denetim FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON ic_denetim FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON ic_denetim FOR DELETE USING (true);

-- denetim_bulgulari
DROP POLICY IF EXISTS "Herkes okuyabilir" ON denetim_bulgulari;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON denetim_bulgulari;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON denetim_bulgulari;
DROP POLICY IF EXISTS "Herkes silebilir" ON denetim_bulgulari;
CREATE POLICY "Herkes okuyabilir" ON denetim_bulgulari FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON denetim_bulgulari FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON denetim_bulgulari FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON denetim_bulgulari FOR DELETE USING (true);

-- acil_durum
DROP POLICY IF EXISTS "Herkes okuyabilir" ON acil_durum;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON acil_durum;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON acil_durum;
DROP POLICY IF EXISTS "Herkes silebilir" ON acil_durum;
CREATE POLICY "Herkes okuyabilir" ON acil_durum FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON acil_durum FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON acil_durum FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON acil_durum FOR DELETE USING (true);

-- duzeltici_faaliyet
DROP POLICY IF EXISTS "Herkes okuyabilir" ON duzeltici_faaliyet;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON duzeltici_faaliyet;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON duzeltici_faaliyet;
DROP POLICY IF EXISTS "Herkes silebilir" ON duzeltici_faaliyet;
CREATE POLICY "Herkes okuyabilir" ON duzeltici_faaliyet FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON duzeltici_faaliyet FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON duzeltici_faaliyet FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON duzeltici_faaliyet FOR DELETE USING (true);

-- yonetim_gozden_gecirme
DROP POLICY IF EXISTS "Herkes okuyabilir" ON yonetim_gozden_gecirme;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON yonetim_gozden_gecirme;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON yonetim_gozden_gecirme;
DROP POLICY IF EXISTS "Herkes silebilir" ON yonetim_gozden_gecirme;
CREATE POLICY "Herkes okuyabilir" ON yonetim_gozden_gecirme FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON yonetim_gozden_gecirme FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON yonetim_gozden_gecirme FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON yonetim_gozden_gecirme FOR DELETE USING (true);

-- dokuman_kontrol
DROP POLICY IF EXISTS "Herkes okuyabilir" ON dokuman_kontrol;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON dokuman_kontrol;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON dokuman_kontrol;
DROP POLICY IF EXISTS "Herkes silebilir" ON dokuman_kontrol;
CREATE POLICY "Herkes okuyabilir" ON dokuman_kontrol FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON dokuman_kontrol FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON dokuman_kontrol FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON dokuman_kontrol FOR DELETE USING (true);

-- yetkinlik_matrisi
DROP POLICY IF EXISTS "Herkes okuyabilir" ON yetkinlik_matrisi;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON yetkinlik_matrisi;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON yetkinlik_matrisi;
DROP POLICY IF EXISTS "Herkes silebilir" ON yetkinlik_matrisi;
CREATE POLICY "Herkes okuyabilir" ON yetkinlik_matrisi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON yetkinlik_matrisi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON yetkinlik_matrisi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON yetkinlik_matrisi FOR DELETE USING (true);

-- performans_izleme
DROP POLICY IF EXISTS "Herkes okuyabilir" ON performans_izleme;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON performans_izleme;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON performans_izleme;
DROP POLICY IF EXISTS "Herkes silebilir" ON performans_izleme;
CREATE POLICY "Herkes okuyabilir" ON performans_izleme FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON performans_izleme FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON performans_izleme FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON performans_izleme FOR DELETE USING (true);
