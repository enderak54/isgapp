-- ayarlar.key üzerinde UNIQUE garantisi + önceki yinelenen satırların temizliği.
-- Tekilliği bozan yinelemeli kayıtlar, talimat_sutunlari vb. anahtarların
-- .maybeSingle()/upsert(onConflict:key) ile okunmasını engelliyordu.

WITH dedupe AS (
  DELETE FROM public.ayarlar a
  USING public.ayarlar b
  WHERE a.key = b.key AND a.id > b.id
)
SELECT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ayarlar_key_key') THEN
    ALTER TABLE public.ayarlar ADD CONSTRAINT ayarlar_key_key UNIQUE (key);
  END IF;
END $$;