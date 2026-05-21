-- Audit Log Table for ISO 27001 / KVKK Compliance
-- Tracks all data modifications for accountability

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(50) NOT NULL,
  record_id uuid,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- RLS Policies (Public - Development Mode)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes okuyabilir" ON audit_log;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON audit_log;

CREATE POLICY "Herkes okuyabilir" ON audit_log FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON audit_log FOR INSERT WITH CHECK (true);

-- Auto-cleanup: Keep audit logs for 2 years (KVKK requirement)
-- This is a comment for manual setup:
-- SELECT cron.schedule('cleanup-audit-log', '0 0 1 * *', $$DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '2 years'$$);
