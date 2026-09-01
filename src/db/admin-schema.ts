export const ADMIN_AUDIT_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  slug TEXT,
  session_hash TEXT,
  result TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx
  ON admin_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx
  ON admin_audit_log (action);
`.trim();

export const ADMIN_ENTITY_INDEX_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admin_entity_index (
  slug TEXT PRIMARY KEY,
  company_name TEXT,
  phone TEXT,
  unified_stage TEXT NOT NULL DEFAULT 'discovered',
  is_customer BOOLEAN NOT NULL DEFAULT FALSE,
  sms_status TEXT,
  view_count INT NOT NULL DEFAULT 0,
  demo_age_days INT,
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_entity_index_stage_idx
  ON admin_entity_index (unified_stage);

CREATE INDEX IF NOT EXISTS admin_entity_index_activity_idx
  ON admin_entity_index (last_activity_at DESC);

CREATE INDEX IF NOT EXISTS admin_entity_index_company_idx
  ON admin_entity_index (company_name);
`.trim();
