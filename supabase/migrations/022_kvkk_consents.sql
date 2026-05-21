-- KVKK Consent Tracking Table
-- Required for GDPR/KVKK compliance when processing personal data

CREATE TABLE IF NOT EXISTS kvkk_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personel_id uuid REFERENCES personel(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('islenmesi', 'saklanmasi', 'paylasilmasi', 'saglik_verisi')),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMPTZ DEFAULT NOW(),
  consent_version VARCHAR(20) DEFAULT '1.0',
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one consent per type per person
CREATE UNIQUE INDEX IF NOT EXISTS idx_kvkk_consents_unique ON kvkk_consents(personel_id, consent_type);

-- RLS Policies (Public - Development Mode)
ALTER TABLE kvkk_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes okuyabilir" ON kvkk_consents;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON kvkk_consents;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON kvkk_consents;

CREATE POLICY "Herkes okuyabilir" ON kvkk_consents FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON kvkk_consents FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON kvkk_consents FOR UPDATE USING (true);
