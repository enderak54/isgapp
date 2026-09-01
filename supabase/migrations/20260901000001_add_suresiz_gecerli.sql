-- Süresiz geçerli (diploma/sertifika) MYK belgelerini 'Tarih eksik' uyarısından muaf tutmak için
-- personel_belgeleri tablosuna suresiz_gecerli bayrağı ekler.
-- Diploma/sertifika kopyaları (belge_tipi='myk', son_gecerlilik_tarihi NULL) sürekli geçerlidir,
-- bu yüzden MYK listesinde 'Tarih eksik' rozeti gösterilmez.

ALTER TABLE public.personel_belgeleri ADD COLUMN IF NOT EXISTS suresiz_gecerli boolean NOT NULL DEFAULT false;

-- Mevcut süresiz kopyaları işaretle (belge_tipi='myk' ve bitiş tarihi olmayan kayıtlar süresiz kabul edilir)
UPDATE public.personel_belgeleri
SET suresiz_gecerli = true
WHERE suresiz_gecerli = false
  AND belge_tipi = 'myk'
  AND son_gecerlilik_tarihi IS NULL;
