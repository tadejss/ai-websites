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
  is_actionable_sms BOOLEAN NOT NULL DEFAULT FALSE,
  is_never_viewed BOOLEAN NOT NULL DEFAULT FALSE,
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

CREATE INDEX IF NOT EXISTS admin_entity_index_actionable_idx
  ON admin_entity_index (is_actionable_sms) WHERE is_actionable_sms = TRUE;

ALTER TABLE admin_entity_index ADD COLUMN IF NOT EXISTS is_actionable_sms BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE admin_entity_index ADD COLUMN IF NOT EXISTS is_never_viewed BOOLEAN NOT NULL DEFAULT FALSE;
`.trim();

export const ADMIN_QUEUE_SNOOZE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admin_queue_snooze (
  slug TEXT PRIMARY KEY,
  until_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_queue_snooze_until_idx
  ON admin_queue_snooze (until_at);
`.trim();

export const ADMIN_SYSTEM_EVENTS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admin_system_events (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  slug TEXT,
  message TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_system_events_created_idx
  ON admin_system_events (created_at DESC);
`.trim();

/**
 * Server-side admin sessions. Only a SHA-256 hash of the cookie token is stored.
 * Plaintext tokens and ADMIN_SECRET must never appear in this table.
 */
export const ADMIN_SESSIONS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS admin_sessions_expires_idx
  ON admin_sessions (expires_at);

CREATE INDEX IF NOT EXISTS admin_sessions_active_last_seen_idx
  ON admin_sessions (last_seen_at)
  WHERE revoked_at IS NULL;
`.trim();

export const ADMIN_SCHEMA_SQL = [
  ADMIN_AUDIT_SCHEMA_SQL,
  ADMIN_ENTITY_INDEX_SCHEMA_SQL,
  ADMIN_QUEUE_SNOOZE_SCHEMA_SQL,
  ADMIN_SYSTEM_EVENTS_SCHEMA_SQL,
  ADMIN_SESSIONS_SCHEMA_SQL,
].join(";\n");
