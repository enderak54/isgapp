-- personel_talimat_matrisi: (personel_id, talimat_adi) ikilisi tekil olmali
-- Aksi halde upsert(onConflict: personel_id,talimat_adi) calismaz ve tarih kaybolur.

-- 1) Ayni personel+talimat icin tekrarli satirlari temizle (en yeni kalsin)
WITH dedup AS (
  DELETE FROM public.personel_talimat_matrisi a
  USING public.personel_talimat_matrisi b
  WHERE a.personel_id = b.personel_id
    AND a.talimat_adi = b.talimat_adi
    AND a.id > b.id
)
SELECT 1;

-- 2) Unique constraint ekle (yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'personel_talimat_matrisi_personel_talimat_unique'
  ) THEN
    ALTER TABLE public.personel_talimat_matrisi
      ADD CONSTRAINT personel_talimat_matrisi_personel_talimat_unique
      UNIQUE (personel_id, talimat_adi);
  END IF;
END $$;
