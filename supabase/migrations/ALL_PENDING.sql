-- TÜM BEKLEYEN MİGRATION'LAR (007-016)
-- Supabase SQL Editor'a yapıştır ve çalıştır

-- ===== 007_iso45001_modules.sql =====
-- ISO 45001 Ek ModÃ¼ller TablolarÄ±
-- Risk DeÄŸerlendirme, Yasal Uygunluk, Ä°Ã§ Denetim, Acil Durum,
-- DÃ¼zeltici Faaliyet, YÃ¶netim GÃ¶zden GeÃ§irme, DokÃ¼man Kontrol,
-- Yetkinlik Matrisi, Performans Ä°zleme

-- 1. Risk DeÄŸerlendirme (Clause 6.1.2)
CREATE TABLE IF NOT EXISTS risk_degerlendirme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  santiye_id uuid REFERENCES santiyeler(id) ON DELETE SET NULL,
  risk_adi text NOT NULL,
  bolum text,
  tehlike_tipi text,
  mevcut_onlem text,
  olasilik int DEFAULT 1 CHECK (olasilik BETWEEN 1 AND 5),
  siddet int DEFAULT 1 CHECK (siddet BETWEEN 1 AND 5),
  risk_skoru int GENERATED ALWAYS AS (olasilik * siddet) STORED,
  risk_seviyesi text GENERATED ALWAYS AS (
    CASE
      WHEN olasilik * siddet <= 4 THEN 'Dusuk'
      WHEN olasilik * siddet <= 9 THEN 'Orta'
      WHEN olasilik * siddet <= 15 THEN 'Yuksek'
      ELSE 'Kritik'
    END
  ) STORED,
  ek_onlemler text,
  sorumlu_kisi text,
  tamamlanma_tarihi date,
  durum text DEFAULT 'acik' CHECK (durum IN ('acik', 'devam', 'tamamlandi', 'iptal')),
  olusturma_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now()
);

-- 2. Yasal Uygunluk (Clause 6.1.3)
CREATE TABLE IF NOT EXISTS yasal_uygunluk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yasal_metin_adi text NOT NULL,
  yasal_dayanak text,
  yayin_tarihi date,
  resmi_gazete_no text,
  kapsam text,
  uyumluluk_durumu text DEFAULT 'degerlendirilecek' CHECK (uyumluluk_durumu IN ('uyumlu', 'kismen_uyumlu', 'uyumsuz', 'degerlendirilecek')),
  uyumsuzluk_aciklama text,
  gerekli_aksiyonlar text,
  sorumlu_kisi text,
  son_degerlendirme_tarihi date,
  sonraki_degerlendirme_tarihi date,
  notlar text,
  olusturma_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now()
);

-- 3. Ä°Ã§ Denetim (Clause 9.2)
CREATE TABLE IF NOT EXISTS ic_denetim (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  denetim_adi text NOT NULL,
  denetim_tarihi date NOT NULL,
  denetim_tipi text DEFAULT 'ic' CHECK (denetim_tipi IN ('ic', 'dis', 'sertifikasyon')),
  denetci text NOT NULL,
  kapsam text,
  kapsam_alanlari text[],
  bulgu_sayisi int DEFAULT 0,
  uygunsuzluk_sayisi int DEFAULT 0,
  gozlem_sayisi int DEFAULT 0,
  guclu_yonler text,
  iyilestirme_alanlari text,
  genel_degerlendirme text,
  rapor_url text,
  durum text DEFAULT 'planlandi' CHECK (durum IN ('planlandi', 'devam', 'tamamlandi', 'iptal')),
  olusturma_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now()
);

-- Denetim BulgularÄ± (alt tablo)
CREATE TABLE IF NOT EXISTS denetim_bulgulari (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  denetim_id uuid REFERENCES ic_denetim(id) ON DELETE CASCADE,
  bulgu_no text,
  bulgu_tipi text CHECK (bulgu_tipi IN ('uygunsuzluk', 'gozlem', 'firsat', 'guclu_yon')),
  bolum text,
  bulgu_aciklama text NOT NULL,
  dayanak_madde text,
  oneri text,
  sorumlu_kisi text,
  duzeltme_tarihi date,
  durum text DEFAULT 'acik' CHECK (durum IN ('acik', 'devam', 'tamamlandi')),
  olusturma_tarihi timestamptz DEFAULT now()
);

-- 4. Acil Durum PlanÄ± (Clause 8.2)
CREATE TABLE IF NOT EXISTS acil_durum (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_adi text NOT NULL,
  senaryo_tipi text NOT NULL CHECK (senaryo_tipi IN ('yangin', 'deprem', 'sel', 'kimyasal_dokulme', 'patlama', 'elektrik_carpma', 'gocekme', 'diger')),
  senaryo_aciklama text,
  etki_alani text,
  risk_seviyesi text DEFAULT 'orta' CHECK (risk_seviyesi IN ('dusuk', 'orta', 'yuksek', 'kritik')),
  onleyici_onlemler text,
  mudahale_proseduru text,
  tahliye_plani text,
  acil_durum_ekibi text[],
  iletisim_bilgileri text,
  ekipman_listesi text,
  son_tatbikat_tarihi date,
  sonraki_tatbikat_tarihi date,
  tatbikat_sonucu text,
  durum text DEFAULT 'aktif' CHECK (durum IN ('aktif', 'gozden_geciriliyor', 'pasif')),
  olusturma_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now()
);

-- 5. DÃ¼zeltici Faaliyet (Clause 10.1)
CREATE TABLE IF NOT EXISTS duzeltici_faaliyet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kaynak text CHECK (kaynak IN ('is_kazasi', 'denetim', 'sikayet', 'gozlem', 'risk_analizi', 'yasal_gereklilik', 'diger')),
  kaynak_id uuid,
  baslik text NOT NULL,
  uygunsuzluk_aciklama text NOT NULL,
  kok_neden_analizi text,
  analiz_yontemi text CHECK (analiz_yontemi IN ('5_neden', 'balik_kilcigi', 'pareto', 'fta', 'diger')),
  duzeltici_aksiyon text NOT NULL,
  onleyici_aksiyon text,
  sorumlu_kisi text NOT NULL,
  baslangic_tarihi date DEFAULT now(),
  hedef_tarih date,
  tamamlanma_tarihi date,
  etki_degerlendirmesi text,
  dogrulama_sonucu text CHECK (dogrulama_sonucu IN ('etkili', 'kismen_etkili', 'etkisiz', 'beklemede')),
  durum text DEFAULT 'acik' CHECK (durum IN ('acik', 'devam', 'dogrulama', 'tamamlandi', 'kapatildi')),
  olusturma_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now()
);

-- 6. YÃ¶netim GÃ¶zden GeÃ§irme (Clause 9.3)
CREATE TABLE IF NOT EXISTS yonetim_gozden_gecirme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  toplantÄ±_adi text NOT NULL,
  toplantÄ±_tarihi date NOT NULL,
  katilimcilar text[],
  gundem_maddeleri text[],
  isg_performans_ozeti text,
  kaza_istatistikleri text,
  denetim_sonuclari text,
  yasal_uygunluk_durumu text,
  risk_degerlendirme_guncelleme text,
  kaynak_yeterliligi text,
  iyilestirme_firsatlari text,
  aksiyon_kararlari text,
  bir_onceki_toplanti_takibi text,
  sonuclar_ve_oneriler text,
  rapor_url text,
  durum text DEFAULT 'planlandi' CHECK (durum IN ('planlandi', 'yapildi', 'rapor_hazirlaniyor', 'tamamlandi')),
  olusturma_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now()
);

-- 7. DokÃ¼man Kontrol (Clause 7.5)
CREATE TABLE IF NOT EXISTS dokuman_kontrol (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokuman_adi text NOT NULL,
  dokuman_no text,
  versiyon text DEFAULT '1.0',
  dokuman_tipi text CHECK (dokuman_tipi IN ('prosedur', 'talimat', 'form', 'plan', 'rapor', 'politika', 'diger')),
  icerik_ozeti text,
  hazirlayan text,
  onaylayan text,
  onay_tarihi date,
  yayin_tarihi date,
  gecerlilik_tarihi date,
  dosya_url text,
  durum text DEFAULT 'taslak' CHECK (durum IN ('taslak', 'onay_bekliyor', 'yayinda', 'gecersiz', 'arsiv')),
  degisiklik_aciklama text,
  ilgili_dokumanlar text[],
  olusturma_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now()
);

-- 8. Yetkinlik Matrisi (Clause 7.2)
CREATE TABLE IF NOT EXISTS yetkinlik_matrisi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personel_id uuid REFERENCES personel(id) ON DELETE CASCADE,
  yetkinlik_adi text NOT NULL,
  yetkinlik_tipi text CHECK (yetkinlik_tipi IN ('egitim', 'sertifika', 'deneyim', 'lisans', 'diger')),
  zorunlu_mu boolean DEFAULT false,
  seviye int DEFAULT 1 CHECK (seviye BETWEEN 1 AND 5),
  gereken_seviye int DEFAULT 1 CHECK (gereken_seviye BETWEEN 1 AND 5),
  alis_tarihi date,
  gecerlilik_tarihi date,
  veren_kurum text,
  belge_no text,
  belge_url text,
  durum text DEFAULT 'gecerli' CHECK (durum IN ('gecerli', 'suresi_doluyor', 'suresi_dolmus', 'beklemede')),
  notlar text,
  olusturma_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now()
);

-- 9. Performans Ä°zleme (Clause 9.1)
CREATE TABLE IF NOT EXISTS performans_izleme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gosterge_adi text NOT NULL,
  gosterge_tipi text CHECK (gosterge_tipi IN ('leading', 'lagging')),
  birim text,
  hedef_deger numeric,
  gercek_deger numeric,
  olcum_tarihi date NOT NULL,
  onceki_deger numeric,
  trend text GENERATED ALWAYS AS (
    CASE
      WHEN gercek_deger IS NULL OR onceki_deger IS NULL THEN 'bilinmiyor'
      WHEN gercek_deger > onceki_deger THEN 'artis'
      WHEN gercek_deger < onceki_deger THEN 'azalis'
      ELSE 'sabit'
    END
  ) STORED,
  hedef_ulasildi_mu boolean GENERATED ALWAYS AS (
    CASE
      WHEN gercek_deger IS NULL OR hedef_deger IS NULL THEN NULL
      WHEN gercek_deger >= hedef_deger THEN true
      ELSE false
    END
  ) STORED,
  aciklama text,
  aksiyon_gerekli_mu boolean DEFAULT false,
  aksiyon_aciklama text,
  olusturma_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now()
);


-- ===== 008_iso45001_rls.sql =====
-- ISO 45001 Ek ModÃ¼ller iÃ§in RLS PolitikalarÄ± (Public - GeliÅŸtirme AÅŸamasÄ±)

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


-- ===== 009_add_ogrenim_durumu.sql =====
-- Personel tablosuna ogrenim_durumu kolonu ekle
ALTER TABLE personel ADD COLUMN IF NOT EXISTS ogrenim_durumu text;


-- ===== 010_add_ihtar.sql =====
-- Ä°htar TutanaÄŸÄ± tablosu
CREATE TABLE IF NOT EXISTS ihtar_tutanagi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personel_id uuid REFERENCES personel(id) ON DELETE SET NULL,
  ihtar_tipi text DEFAULT 'uyari' CHECK (ihtar_tipi IN ('yazili', 'kesin', 'uyari', 'kinai')),
  tarih date NOT NULL,
  yer text,
  konu text NOT NULL,
  aciklama text,
  dayanak_madde text,
  teblig_tarihi date,
  personel_gorusu text,
  durum text DEFAULT 'duzenlendi' CHECK (durum IN ('duzenlendi', 'teblig edildi', 'itiraz var', 'kapatildi')),
  olusturma_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now()
);


-- ===== 011_ihtar_rls.sql =====
-- Ä°htar TutanaÄŸÄ± RLS PolitikalarÄ± (Public - GeliÅŸtirme AÅŸamasÄ±)

DROP POLICY IF EXISTS "Herkes okuyabilir" ON ihtar_tutanagi;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON ihtar_tutanagi;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON ihtar_tutanagi;
DROP POLICY IF EXISTS "Herkes silebilir" ON ihtar_tutanagi;

CREATE POLICY "Herkes okuyabilir" ON ihtar_tutanagi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON ihtar_tutanagi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON ihtar_tutanagi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON ihtar_tutanagi FOR DELETE USING (true);


-- ===== 012_add_kronik_rahatlik.sql =====
-- Personel tablosuna kronik_rahatlik kolonu ekle
ALTER TABLE personel ADD COLUMN IF NOT EXISTS kronik_rahatlik text;


-- ===== 013_add_ihtar_dosyalari.sql =====
-- Ä°htar TutanaÄŸÄ± Dosya Ekleri tablosu
CREATE TABLE IF NOT EXISTS ihtar_dosyalari (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ihtar_id uuid REFERENCES ihtar_tutanagi(id) ON DELETE CASCADE,
  dosya_url text NOT NULL,
  dosya_adi text NOT NULL,
  dosya_turu text CHECK (dosya_turu IN ('gorsel', 'belge')),
  dosya_uzantisi text,
  dosya_boyut int,
  neden text,
  eklenme_tarihi timestamptz DEFAULT now(),
  guncelleme_tarihi timestamptz DEFAULT now(),
  silinme_tarihi timestamptz
);


-- ===== 014_ihtar_dosyalari_rls.sql =====
-- Ä°htar DosyalarÄ± RLS PolitikalarÄ± (Public - GeliÅŸtirme AÅŸamasÄ±)

DROP POLICY IF EXISTS "Herkes okuyabilir" ON ihtar_dosyalari;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON ihtar_dosyalari;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON ihtar_dosyalari;
DROP POLICY IF EXISTS "Herkes silebilir" ON ihtar_dosyalari;

CREATE POLICY "Herkes okuyabilir" ON ihtar_dosyalari FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON ihtar_dosyalari FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON ihtar_dosyalari FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON ihtar_dosyalari FOR DELETE USING (true);


-- ===== 015_add_versiyonlar.sql =====
-- SÃ¼rÃ¼m Takip tablosu
CREATE TABLE IF NOT EXISTS versiyonlar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  versiyon text NOT NULL,
  tarih date NOT NULL DEFAULT now(),
  tip text CHECK (tip IN ('major', 'minor', 'patch', 'hotfix')),
  aciklama text NOT NULL,
  detaylar text[],
  yazar text,
  olusturma_tarihi timestamptz DEFAULT now()
);

-- Ä°lk versiyon kaydÄ±
INSERT INTO versiyonlar (versiyon, tarih, tip, aciklama, detaylar, yazar) VALUES
  ('0.1.0', now(), 'minor', 'Ä°lk kararlÄ± sÃ¼rÃ¼m - Temel ISG modÃ¼lleri', ARRAY[
    'Personel yÃ¶netimi (CRUD, TC maskeleme, sanitasyon)',
    'MYK ve OperatÃ¶r belge takibi',
    'Ä°ÅŸ ekipmanlarÄ± ve ÅŸantiye yÃ¶netimi',
    'Ä°ÅŸ kazalarÄ± ve eÄŸitim kayÄ±tlarÄ±',
    'TaÅŸeron ve saha sorumlularÄ± takibi',
    'Koyu/aÃ§Ä±k tema, 8 renk, 8 yazÄ± tipi, 4 boyut',
    'Ek modÃ¼ller: Risk, Yasal, Denetim, Acil Durum, CAPA, YGG, DokÃ¼man, Yetkinlik, Performans',
    'Ä°htar tutanaÄŸÄ± + dosya yÃ¶netimi (drag-drop)',
    'Kronik rahatsÄ±zlÄ±k ve Ã¶ÄŸrenim durumu alanlarÄ±',
    'Otomatik migration sistemi (npm run migrate)'
  ], 'ISG Takip Ekibi');


-- ===== 016_versiyonlar_rls.sql =====
-- Versiyonlar RLS PolitikalarÄ± (Public - GeliÅŸtirme AÅŸamasÄ±)

DROP POLICY IF EXISTS "Herkes okuyabilir" ON versiyonlar;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON versiyonlar;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON versiyonlar;
DROP POLICY IF EXISTS "Herkes silebilir" ON versiyonlar;

CREATE POLICY "Herkes okuyabilir" ON versiyonlar FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON versiyonlar FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON versiyonlar FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON versiyonlar FOR DELETE USING (true);



