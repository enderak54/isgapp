-- AI Risk Suggestions and Data Quality Tables

CREATE TABLE IF NOT EXISTS ai_risk_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
        'risk_onleme', 'psikososyal', 'ergonomi', 'egitim', 'kaza_onleme', 'veri_kalitesi', 'genel'
    )),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'bilgi' CHECK (severity IN ('kritik', 'uyari', 'bilgi')),
    source_table TEXT,
    source_record_id UUID,
    related_module TEXT,
    metadata JSONB DEFAULT '{}',
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON ai_risk_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_severity ON ai_risk_suggestions(severity);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_resolved ON ai_risk_suggestions(is_resolved);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_created ON ai_risk_suggestions(created_at DESC);

ALTER TABLE ai_risk_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes okuyabilir" ON ai_risk_suggestions;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON ai_risk_suggestions;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON ai_risk_suggestions;
DROP POLICY IF EXISTS "Herkes silebilir" ON ai_risk_suggestions;

CREATE POLICY "Herkes okuyabilir" ON ai_risk_suggestions FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON ai_risk_suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON ai_risk_suggestions FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON ai_risk_suggestions FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_name TEXT NOT NULL,
    total_records INTEGER NOT NULL DEFAULT 0,
    complete_records INTEGER NOT NULL DEFAULT 0,
    missing_critical_fields INTEGER NOT NULL DEFAULT 0,
    outdated_records INTEGER NOT NULL DEFAULT 0,
    quality_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_quality_module ON data_quality_metrics(module_name);
CREATE INDEX IF NOT EXISTS idx_data_quality_measured ON data_quality_metrics(measured_at DESC);

ALTER TABLE data_quality_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes okuyabilir" ON data_quality_metrics;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON data_quality_metrics;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON data_quality_metrics;
DROP POLICY IF EXISTS "Herkes silebilir" ON data_quality_metrics;

CREATE POLICY "Herkes okuyabilir" ON data_quality_metrics FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON data_quality_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON data_quality_metrics FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON data_quality_metrics FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION generate_risk_suggestions()
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
    r_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO r_count FROM personel 
    WHERE isg_egitim_tarihi IS NOT NULL 
      AND isg_egitim_tarihi < NOW() - INTERVAL '1 year';
    
    IF r_count > 0 THEN
        INSERT INTO ai_risk_suggestions (suggestion_type, title, description, severity, source_table, related_module)
        VALUES ('egitim', 'Egitim suresi dolan personel', 
                r_count || ' personelin ISG egitim suresi dolmus veya dolmak uzere.',
                CASE WHEN r_count > 5 THEN 'kritik' WHEN r_count > 2 THEN 'uyari' ELSE 'bilgi' END,
                'personel', 'egitimler');
        inserted_count := inserted_count + 1;
    END IF;

    SELECT COUNT(*) INTO r_count FROM risk_degerlendirme
    WHERE risk_seviyesi IN ('yuksek', 'kabul_edilemez') AND durum = 'aktif';
    
    IF r_count > 0 THEN
        INSERT INTO ai_risk_suggestions (suggestion_type, title, description, severity, source_table, related_module)
        VALUES ('risk_onleme', 'Yuksek riskli degerlendirmeler',
                r_count || ' adet yuksek/kabul edilemez risk bulunuyor.',
                'kritik', 'risk_degerlendirme', 'risk');
        inserted_count := inserted_count + 1;
    END IF;

    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
