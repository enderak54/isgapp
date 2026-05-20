-- Güvenlik düzeltmeleri
-- NOT: Bu uygulama için Supabase Auth henüz kurulu değil.
-- Auth kurulduktan sonra politikalar auth.uid() ile kısıtlanmalıdır.
-- Şimdilik public erişim korunuyor, sadece ayarlar tablosu düzeltiliyor.

-- exec_sql RPC varsa kaldır (güvenlik riski)
DROP FUNCTION IF EXISTS exec_sql;

-- ayarlar tablosu için RLS etkinleştir
ALTER TABLE ayarlar ENABLE ROW LEVEL SECURITY;

-- eski politikaları temizle
DROP POLICY IF EXISTS "okuma" ON ayarlar;
DROP POLICY IF EXISTS "yazma" ON ayarlar;

-- yeni politikalar (public - auth kurulana kadar)
CREATE POLICY "ayarlar_select" ON ayarlar FOR SELECT USING (true);
CREATE POLICY "ayarlar_insert" ON ayarlar FOR INSERT WITH CHECK (true);
CREATE POLICY "ayarlar_update" ON ayarlar FOR UPDATE USING (true);
CREATE POLICY "ayarlar_delete" ON ayarlar FOR DELETE USING (true);
