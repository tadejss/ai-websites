/**
 * Durable security state (onboarding sessions, rate-limit buckets).
 * Applied via ensureSecuritySchema() — same IF NOT EXISTS style as other schemas.
 */
export const ONBOARDING_SESSIONS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  token_hash TEXT PRIMARY KEY,
  slug TEXT NOT NULL REFERENCES customers (slug) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS onboarding_sessions_slug_idx
  ON onboarding_sessions (slug);

CREATE INDEX IF NOT EXISTS onboarding_sessions_expires_idx
  ON onboarding_sessions (expires_at);

CREATE INDEX IF NOT EXISTS onboarding_sessions_active_idx
  ON onboarding_sessions (last_seen_at)
  WHERE revoked_at IS NULL;
`.trim();

/**
 * Fixed-window rate limit buckets. bucket_key is a keyed hash — never store raw IPs.
 */
export const RATE_LIMIT_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 0,
  window_starts_at TIMESTAMPTZ NOT NULL,
  window_ends_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limit_buckets_expires_idx
  ON rate_limit_buckets (window_ends_at);
`.trim();

export const SECURITY_SCHEMA_SQL = [
  ONBOARDING_SESSIONS_SCHEMA_SQL,
  RATE_LIMIT_SCHEMA_SQL,
].join(";\n");
