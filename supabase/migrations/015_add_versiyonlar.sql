-- Sürüm Takip tablosu
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

-- İlk versiyon kaydı
INSERT INTO versiyonlar (versiyon, tarih, tip, aciklama, detaylar, yazar) VALUES
  ('0.1.0', now(), 'minor', 'İlk kararlı sürüm - Temel ISG modülleri', ARRAY[
    'Personel yönetimi (CRUD, TC maskeleme, sanitasyon)',
    'MYK ve Operatör belge takibi',
    'İş ekipmanları ve şantiye yönetimi',
    'İş kazaları ve eğitim kayıtları',
    'Taşeron ve saha sorumluları takibi',
    'Koyu/açık tema, 8 renk, 8 yazı tipi, 4 boyut',
    'Ek modüller: Risk, Yasal, Denetim, Acil Durum, CAPA, YGG, Doküman, Yetkinlik, Performans',
    'İhtar tutanağı + dosya yönetimi (drag-drop)',
    'Kronik rahatsızlık ve öğrenim durumu alanları',
    'Otomatik migration sistemi (npm run migrate)'
  ], 'ISG Takip Ekibi');
