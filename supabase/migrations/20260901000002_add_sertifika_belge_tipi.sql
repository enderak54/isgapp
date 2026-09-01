-- personel_belgeleri belge_tipi CHECK constraint'ine 'sertifika' tipini ekler.
-- Sertifika belgeleri bundan önce CHECK nedeniyle insert edilemiyordu.

ALTER TABLE public.personel_belgeleri DROP CONSTRAINT IF EXISTS personel_belgeleri_belge_tipi_check;
ALTER TABLE public.personel_belgeleri ADD CONSTRAINT personel_belgeleri_belge_tipi_check
  CHECK (belge_tipi = ANY (ARRAY['isg_egitim'::text, 'yuksekte_calisma'::text, 'myk'::text, 'operator_belgesi'::text, 'kkd'::text, 'oryantasyon'::text, 'saglik_raporu'::text, 'sertifika'::text, 'diger'::text, 'diploma'::text]));