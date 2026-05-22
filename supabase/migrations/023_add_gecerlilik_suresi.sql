ALTER TABLE personel ADD COLUMN IF NOT EXISTS isg_egitim_gecerlilik_suresi INTEGER CHECK (isg_egitim_gecerlilik_suresi BETWEEN 1 AND 5);
ALTER TABLE personel ADD COLUMN IF NOT EXISTS yuksekte_calisma_gecerlilik_suresi INTEGER CHECK (yuksekte_calisma_gecerlilik_suresi BETWEEN 1 AND 5);
ALTER TABLE personel ADD COLUMN IF NOT EXISTS myk_gecerlilik_suresi INTEGER CHECK (myk_gecerlilik_suresi BETWEEN 1 AND 5);
ALTER TABLE personel ADD COLUMN IF NOT EXISTS sertifika_gecerlilik_suresi INTEGER CHECK (sertifika_gecerlilik_suresi BETWEEN 1 AND 5);
ALTER TABLE personel ADD COLUMN IF NOT EXISTS operator_belgesi_gecerlilik_suresi INTEGER CHECK (operator_belgesi_gecerlilik_suresi BETWEEN 1 AND 5);
ALTER TABLE personel ADD COLUMN IF NOT EXISTS kkd_gecerlilik_suresi INTEGER CHECK (kkd_gecerlilik_suresi BETWEEN 1 AND 5);
ALTER TABLE personel ADD COLUMN IF NOT EXISTS oryantasyon_gecerlilik_suresi INTEGER CHECK (oryantasyon_gecerlilik_suresi BETWEEN 1 AND 5);
ALTER TABLE personel ADD COLUMN IF NOT EXISTS saglik_raporu_gecerlilik_suresi INTEGER CHECK (saglik_raporu_gecerlilik_suresi BETWEEN 1 AND 5);
