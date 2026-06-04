-- Fix RLS: revert to PUBLIC (dev mode) — app has no login, uses anon key
-- Previous migration tried authenticated-only but broke all queries

DROP POLICY IF EXISTS "santiyeler_select" ON santiyeler;
DROP POLICY IF EXISTS "santiyeler_insert" ON santiyeler;
DROP POLICY IF EXISTS "santiyeler_update" ON santiyeler;
DROP POLICY IF EXISTS "santiyeler_delete" ON santiyeler;
DROP POLICY IF EXISTS "Herkes güncelleyebilir" ON santiyeler;
ALTER TABLE santiyeler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON santiyeler FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON santiyeler FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON santiyeler FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON santiyeler FOR DELETE USING (true);

DROP POLICY IF EXISTS "ekipler_select" ON ekipler;
DROP POLICY IF EXISTS "ekipler_insert" ON ekipler;
DROP POLICY IF EXISTS "ekipler_update" ON ekipler;
DROP POLICY IF EXISTS "ekipler_delete" ON ekipler;
DROP POLICY IF EXISTS "Herkes güncelleyebilir" ON ekipler;
ALTER TABLE ekipler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON ekipler FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON ekipler FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON ekipler FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON ekipler FOR DELETE USING (true);

DROP POLICY IF EXISTS "ps_select" ON personel_santiyeler;
DROP POLICY IF EXISTS "ps_insert" ON personel_santiyeler;
DROP POLICY IF EXISTS "ps_delete" ON personel_santiyeler;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON personel_santiyeler;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON personel_santiyeler;
DROP POLICY IF EXISTS "Herkes silebilir" ON personel_santiyeler;
ALTER TABLE personel_santiyeler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes okuyabilir" ON personel_santiyeler FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON personel_santiyeler FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes silebilir" ON personel_santiyeler FOR DELETE USING (true);
