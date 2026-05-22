CREATE TABLE IF NOT EXISTS yedekleme_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mod VARCHAR(20) NOT NULL CHECK (mod IN ('tam', 'kismi')),
  tablo_sayisi INTEGER NOT NULL DEFAULT 0,
  kayit_sayisi INTEGER NOT NULL DEFAULT 0,
  dosya_sayisi INTEGER NOT NULL DEFAULT 0,
  dosya_boyutu_bytes BIGINT NOT NULL DEFAULT 0,
  hata TEXT,
  olusturulma TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE yedekleme_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes okuyabilir" ON yedekleme_log;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON yedekleme_log;

CREATE POLICY "Herkes okuyabilir" ON yedekleme_log FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON yedekleme_log FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_yedekleme_log_tarih ON yedekleme_log(olusturulma DESC);
