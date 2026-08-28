-- Diploma ve MYK/İSG dışı sertifikalar için personel_belgeleri belge_tipi genişletmesi
-- Süresiz: sadece ad + PDF, son_gecerlilik_tarihi null kalır

ALTER TABLE public.personel_belgeleri DROP CONSTRAINT IF EXISTS personel_belgeleri_belge_tipi_check;
ALTER TABLE public.personel_belgeleri ADD CONSTRAINT personel_belgeleri_belge_tipi_check
  CHECK (belge_tipi = ANY (ARRAY['isg_egitim'::text, 'yuksekte_calisma'::text, 'myk'::text, 'operator_belgesi'::text, 'kkd'::text, 'oryantasyon'::text, 'saglik_raporu'::text, 'diger'::text, 'diploma'::text]));
