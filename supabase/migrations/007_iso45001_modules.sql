-- ISO 45001 Ek Modüller Tabloları
-- Risk Değerlendirme, Yasal Uygunluk, İç Denetim, Acil Durum,
-- Düzeltici Faaliyet, Yönetim Gözden Geçirme, Doküman Kontrol,
-- Yetkinlik Matrisi, Performans İzleme

-- 1. Risk Değerlendirme (Clause 6.1.2)
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

-- 3. İç Denetim (Clause 9.2)
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

-- Denetim Bulguları (alt tablo)
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

-- 4. Acil Durum Planı (Clause 8.2)
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

-- 5. Düzeltici Faaliyet (Clause 10.1)
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

-- 6. Yönetim Gözden Geçirme (Clause 9.3)
CREATE TABLE IF NOT EXISTS yonetim_gozden_gecirme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  toplantı_adi text NOT NULL,
  toplantı_tarihi date NOT NULL,
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

-- 7. Doküman Kontrol (Clause 7.5)
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

-- 9. Performans İzleme (Clause 9.1)
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
