-- Hibrit Çalışma Ergonomi Değerlendirme Tablosu
-- Hibrit/uzaktan çalışanların ergonomik risk değerlendirmesi için

CREATE TABLE IF NOT EXISTS hibrit_calisma_ergonomi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personel_id UUID REFERENCES personel(id) ON DELETE SET NULL,
    degerlendirme_tarihi DATE NOT NULL DEFAULT CURRENT_DATE,
    calisma_turu TEXT NOT NULL CHECK (calisma_turu IN ('tam_uzak', 'hibrit', 'ofiste')),
    ofis_gunu_sayisi INTEGER CHECK (ofis_gunu_sayisi >= 0 AND ofis_gunu_sayisi <= 5),
    masa_turu TEXT CHECK (masa_turu IN ('normal', 'ayarlanabilir_dikey', 'ayarlanabilir_yatay', 'ayarlanabilir_iki_yon', 'diger')),
    sandalye_turu TEXT CHECK (sandalye_turu IN ('normal', 'ergonomik', 'ayarlanabilir_lordoz', 'ayarlanabilir_kolluk', 'diger')),
    ekran_yuksekligi_uygun BOOLEAN,
    klavye_fare_duzeni_uygun BOOLEAN,
    ışık_yeterli BOOLEAN,
    ses_seviyesi_uygun BOOLEAN,
    sıcaklık_nem_uygun BOOLEAN,
    molalar_egizi_uygun BOOLEAN,
    arbe_alkisi_uygun BOOLEAN,
    yapısal_sorunlar TEXT,
    önerilen_onlemler TEXT,
    durum TEXT NOT NULL DEFAULT 'aktif' CHECK (durum IN ('aktif', 'pasif', 'tamamlandı')),
    olusturma_tarihi TIMESTAMPTZ DEFAULT NOW(),
    guncelleme_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_hibrit_calisma_ergonomi_personel ON hibrit_calisma_ergonomi(personel_id);
CREATE INDEX IF NOT EXISTS idx_hibrit_calisma_ergonomi_tarih ON hibrit_calisma_ergonomi(degerlendirme_tarihi);
CREATE INDEX IF NOT EXISTS idx_hibrit_calisma_ergonomi_durum ON hibrit_calisma_ergonomi(durum);

-- RLS Politikaları (Public - Geliştirme Modu)
ALTER TABLE hibrit_calisma_ergonomi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes okuyabilir" ON hibrit_calisma_ergonomi;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON hibrit_calisma_ergonomi;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON hibrit_calisma_ergonomi;
DROP POLICY IF EXISTS "Herkes silebilir" ON hibrit_calisma_ergonomi;

CREATE POLICY "Herkes okuyabilir" ON hibrit_calisma_ergonomi FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON hibrit_calisma_ergonomi FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON hibrit_calisma_ergonomi FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON hibrit_calisma_ergonomi FOR DELETE USING (true);