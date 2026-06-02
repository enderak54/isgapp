-- Data Transfer Logging for KVKK Compliance
-- Logs personal data transfers to enable 72-hour breach notification workflow

CREATE TABLE IF NOT EXISTS data_transfer_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_subject_id UUID REFERENCES personel(id) ON DELETE SET NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('kimlik', 'saglik', 'iletisim', 'finansal', 'ogenel')),
    recipient TEXT NOT NULL, -- Who received the data (organization, person, etc.)
    legal_basis TEXT NOT NULL CHECK (legal_basis IN ('izlenen_mukavelet', 'zonunlu_razilik', 'yasal_gorev', 'yasal_hak_goceri', 'yasal_teminat', 'yasal_gizlilik')),
    transferred_by UUID REFERENCES personel(id) ON DELETE SET NULL, -- Who performed the transfer
    notified_at TIMESTAMPTZ NULL, -- When the 72-hour breach notification was sent (if applicable)
    notification_method TEXT, -- How we notified (email, sms, etc.)
    is_breach BOOLEAN NOT NULL DEFAULT FALSE, -- Whether this transfer is considered a potential breach
    breach_assessment TEXT, -- Assessment of whether this constitutes a reportable breach
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_transfer_log_subject ON data_transfer_log(data_subject_id);
CREATE INDEX IF NOT EXISTS idx_data_transfer_log_date ON data_transfer_log(transfer_date);
CREATE INDEX IF NOT EXISTS idx_data_transfer_log_notified ON data_transfer_log(notified_at) WHERE notified_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_transfer_log_breach ON data_transfer_log(is_breach) WHERE is_breach = TRUE;

-- RLS Policies (Public - Development Mode)
ALTER TABLE data_transfer_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes okuyabilir" ON data_transfer_log;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON data_transfer_log;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON data_transfer_log;

CREATE POLICY "Herkes okuyabilir" ON data_transfer_log FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON data_transfer_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON data_transfer_log FOR UPDATE USING (true);

-- Notification Log for Tracking 72-hour Alerts
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_transfer_id UUID REFERENCES data_transfer_log(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('veri_transferi_bildirim', '72_saat_uyari', 'yasal_bildirim')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recipient TEXT NOT NULL, -- Who we notified (authority, data subject, etc.)
    method TEXT NOT NULL CHECK (method IN ('email', 'sms', 'portal', 'temerrüt')),
    status TEXT NOT NULL CHECK (status IN ('gonderildi', 'basarisiz', 'beklemede')),
    response_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_log_transfer ON notification_log(data_transfer_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent ON notification_log(sent_at);

-- RLS Policies
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes okuyabilir" ON notification_log;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON notification_log;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON notification_log;

CREATE POLICY "Herkes okuyabilir" ON notification_log FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON notification_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON notification_log FOR UPDATE USING (true);

-- Function to check for transfers needing 72-hour breach notification
CREATE OR REPLACE FUNCTION check_overdue_data_transfers()
RETURNS VOID AS $$
DECLARE
    transfer_record RECORD;
BEGIN
    -- Find transfers that are potential breaches, older than 72 hours, and not yet notified
    FOR transfer_record IN
        SELECT id, data_subject_id, transfer_date, recipient, legal_basis, transferred_by
        FROM data_transfer_log
        WHERE is_breach = TRUE
          AND notified_at IS NULL
          AND transfer_date < NOW() - INTERVAL '72 hours'
    LOOP
        -- Log that we are sending a notification (in a real system, this would trigger actual notification)
        INSERT INTO notification_log (
            data_transfer_id,
            notification_type,
            recipient,
            method,
            status
        ) VALUES (
            transfer_record.id,
            '72_saat_uyari',
            'KVKK_Yetkili', -- In real system, this would be the actual authority contact
            'email',
            'beklemede'
        );

        -- Update the transfer record to mark as notified
        UPDATE data_transfer_log
        SET notified_at = NOW(),
            notification_method = 'email'
        WHERE id = transfer_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users (for calling via API)
GRANT EXECUTE ON FUNCTION check_overdue_data_transfers() TO anon, authenticated;

-- Comment on the function
COMMENT ON FUNCTION check_overdue_data_transfers() IS 'Checks for data transfers older than 72 hours that need breach notification and logs the notification attempt.';