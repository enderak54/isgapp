-- Psikososyal Risk Değerlendirme Tablosu
-- Psikososyal risk faktörlerini değerlendirmek ve takip etmek için

CREATE TABLE IF NOT EXISTS psikososyal_risk_degerlendirme (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    santiye_id UUID REFERENCES santiyeler(id) ON DELETE SET NULL,
    bolum TEXT, -- Bölüm veya ekip adı
    risk_faktoru TEXT NOT NULL, -- Psikososyal risk faktörü (iş yükü, kontrollü olmayan stres, vb.)
    aciklama TEXT, -- Risk faktörünün açıklaması
    olasilik INTEGER NOT NULL CHECK (olasilik >= 1 AND olasilik <= 5), -- 1: Nadiren, 5: Sürekli
    etki INTEGER NOT NULL CHECK (etki >= 1 AND etki <= 5), -- 1: Hafif etki, 5: Ciddi etki
    risk_skoru INTEGER GENERATED ALWAYS AS (olasilik * etki) STORED,
    risk_seviyesi TEXT GENERATED ALWAYS AS (
        CASE
            WHEN (olasilik * etki) <= 4 THEN 'Düşük'
            WHEN (olasilik * etki) <= 9 THEN 'Orta'
            WHEN (olasilik * etki) <= 15 THEN 'Yüksek'
            ELSE 'Kritik'
        END
    ) STORED,
    onlenen_onlemler TEXT, -- Şu anda alınan önlemler
    tavsiye_edilen_onlemler TEXT, -- Önerilen ek önlemler
    sorumlu_kisi TEXT, -- Risk değerlendirmesinden sorumlu kişi
    durum TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'pasif', 'giderildi')),
    olusturma_tarihi TIMESTAMPTZ DEFAULT NOW(),
    guncelleme_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_psikososyal_risk_santiye ON psikososyal_risk_degerlendirme(santiye_id);
CREATE INDEX IF NOT EXISTS idx_psikososyal_risk_bolum ON psikososyal_risk_degerlendirme(bolum);
CREATE INDEX IF NOT EXISTS idx_psikososyal_risk_seviye ON psikososyal_risk_degerlendirme(risk_seviyesi);
CREATE INDEX IF NOT EXISTS idx_psikososyal_risk_skor ON psikososyal_risk_degerlendirme(risk_skoru);

-- RLS Politikaları (Public - Geliştirme Modu)
ALTER TABLE psikososyal_risk_degerlendirme ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes okuyabilir" ON psikososyal_risk_degerlendirme;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON psikososyal_risk_degerlendirme;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON psikososyal_risk_degerlendirme;
DROP POLICY IF EXISTS "Herkes silebilir" ON psikososyal_risk_degerlendirme;

CREATE POLICY "Herkes okuyabilir" ON psikososyal_risk_degerlendirme FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON psikososyal_risk_degerlendirme FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON psikososyal_risk_degerlendirme FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON psikososyal_risk_degerlendirme FOR DELETE USING (true);