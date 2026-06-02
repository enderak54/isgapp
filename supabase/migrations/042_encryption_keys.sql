-- Encryption Keys Management for Field-Level Encryption

CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name TEXT NOT NULL UNIQUE,
    key_type TEXT NOT NULL DEFAULT 'aes-gcm' CHECK (key_type IN ('aes-gcm', 'aes-cbc')),
    key_value TEXT NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'AES-GCM',
    key_size INTEGER NOT NULL DEFAULT 256,
    is_active BOOLEAN NOT NULL DEFAULT false,
    rotated_from UUID REFERENCES encryption_keys(id) ON DELETE SET NULL,
    rotation_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_encryption_keys_active ON encryption_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_name ON encryption_keys(key_name);

ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes okuyabilir" ON encryption_keys;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON encryption_keys;
DROP POLICY IF EXISTS "Herkes guncelleyebilir" ON encryption_keys;
DROP POLICY IF EXISTS "Herkes silebilir" ON encryption_keys;

CREATE POLICY "Herkes okuyabilir" ON encryption_keys FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON encryption_keys FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes guncelleyebilir" ON encryption_keys FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON encryption_keys FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION log_encryption_key_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, action_type, record_id, old_data, new_data)
    VALUES ('encryption_keys', TG_OP, COALESCE(NEW.id, OLD.id), 
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_encryption_keys_audit ON encryption_keys;
CREATE TRIGGER trg_encryption_keys_audit
AFTER INSERT OR UPDATE OR DELETE ON encryption_keys
FOR EACH ROW EXECUTE FUNCTION log_encryption_key_audit();
