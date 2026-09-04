/**
 * Persistent customer / payment state (Neon / Vercel Postgres).
 * Applied automatically via ensureCustomerSchema() on first use.
 *
 * Kept as a TS string so the serverless bundle always includes it
 * (raw .sql files are not reliably traced into Vercel functions).
 */
export const CUSTOMER_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS customers (
  slug TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'customer',
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  subscription_plan TEXT,
  purchased_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS customers_stripe_customer_id_uidx
  ON customers (stripe_customer_id);

CREATE UNIQUE INDEX IF NOT EXISTS customers_stripe_subscription_id_uidx
  ON customers (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS customer_purchases (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL REFERENCES customers (slug) ON DELETE CASCADE,
  purchase_kind TEXT NOT NULL,
  upsell_type TEXT,
  stripe_checkout_session_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_object_id TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_purchases_session_uidx
  ON customer_purchases (stripe_checkout_session_id);

CREATE UNIQUE INDEX IF NOT EXISTS customer_purchases_upsell_uidx
  ON customer_purchases (slug, upsell_type)
  WHERE upsell_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS customer_purchases_slug_idx
  ON customer_purchases (slug);

CREATE TABLE IF NOT EXISTS customer_onboarding (
  slug TEXT PRIMARY KEY REFERENCES customers (slug) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  answers JSONB,
  processed_payload JSONB,
  contact_email TEXT,
  contact_name TEXT,
  welcome_email_sent_at TIMESTAMPTZ,
  approval_email_sent_at TIMESTAMPTZ,
  admin_approved_at TIMESTAMPTZ,
  admin_publish_notify_sent_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_onboarding_token_uidx
  ON customer_onboarding (access_token);

CREATE INDEX IF NOT EXISTS customer_onboarding_status_idx
  ON customer_onboarding (status);

ALTER TABLE customer_onboarding ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMPTZ;
ALTER TABLE customer_onboarding ADD COLUMN IF NOT EXISTS admin_publish_notify_sent_at TIMESTAMPTZ;
ALTER TABLE customer_onboarding ADD COLUMN IF NOT EXISTS publish_started_at TIMESTAMPTZ;
ALTER TABLE customer_onboarding ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE customer_onboarding ADD COLUMN IF NOT EXISTS publish_commit_sha TEXT;
ALTER TABLE customer_onboarding ADD COLUMN IF NOT EXISTS publish_error TEXT;

CREATE TABLE IF NOT EXISTS customer_publish_lease (
  slug TEXT PRIMARY KEY REFERENCES customers (slug) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'claimed',
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_domains (
  id BIGSERIAL PRIMARY KEY,
  customer_slug TEXT NOT NULL REFERENCES customers (slug) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  cloudflare_zone_id TEXT,
  source TEXT NOT NULL DEFAULT 'onboarding',
  activated_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_domains_slug_domain_uidx
  ON customer_domains (customer_slug, domain);

CREATE INDEX IF NOT EXISTS customer_domains_status_idx
  ON customer_domains (status);

CREATE TABLE IF NOT EXISTS customer_website_domains (
  id BIGSERIAL PRIMARY KEY,
  customer_slug TEXT NOT NULL REFERENCES customers (slug) ON DELETE CASCADE,
  hostname TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  canonical BOOLEAN NOT NULL DEFAULT FALSE,
  vercel_verified BOOLEAN NOT NULL DEFAULT FALSE,
  vercel_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_website_domains_slug_idx
  ON customer_website_domains (customer_slug);

CREATE INDEX IF NOT EXISTS customer_website_domains_live_hostname_idx
  ON customer_website_domains (hostname)
  WHERE status = 'live';

CREATE TABLE IF NOT EXISTS customer_email_services (
  id BIGSERIAL PRIMARY KEY,
  customer_slug TEXT NOT NULL UNIQUE REFERENCES customers (slug) ON DELETE CASCADE,
  domain_id BIGINT REFERENCES customer_domains (id) ON DELETE SET NULL,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  provider TEXT NOT NULL DEFAULT 'mxroute',
  status TEXT NOT NULL DEFAULT 'not_requested',
  last_error TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  provisioning_step TEXT,
  password_delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  suspended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS customer_email_services_status_retry_idx
  ON customer_email_services (status, next_retry_at);

CREATE TABLE IF NOT EXISTS customer_email_mailboxes (
  id BIGSERIAL PRIMARY KEY,
  email_service_id BIGINT NOT NULL REFERENCES customer_email_services (id) ON DELETE CASCADE,
  domain_id BIGINT NOT NULL REFERENCES customer_domains (id) ON DELETE CASCADE,
  local_part TEXT NOT NULL DEFAULT 'info',
  email_address TEXT NOT NULL,
  provider_mailbox_id TEXT,
  quota_mb INT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  suspended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_email_mailboxes_domain_local_uidx
  ON customer_email_mailboxes (domain_id, local_part);

CREATE INDEX IF NOT EXISTS customer_email_mailboxes_service_idx
  ON customer_email_mailboxes (email_service_id);

CREATE TABLE IF NOT EXISTS customer_email_provision_lease (
  slug TEXT PRIMARY KEY REFERENCES customers (slug) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'claimed',
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`.trim();

export const SMS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sms_messages (
  id BIGSERIAL PRIMARY KEY,
  message_id TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL,
  to_phone TEXT NOT NULL,
  to_phone_raw TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  step TEXT NOT NULL,
  provider_message_id TEXT,
  last_error TEXT,
  claimed_at TIMESTAMPTZ,
  claimed_by TEXT,
  claim_expires_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sms_messages_active_slug_step_uidx
  ON sms_messages (slug, step)
  WHERE status IN ('queued', 'claimed', 'sending', 'sent');

CREATE INDEX IF NOT EXISTS sms_messages_status_created_idx
  ON sms_messages (status, created_at);

CREATE INDEX IF NOT EXISTS sms_messages_slug_idx
  ON sms_messages (slug);

CREATE TABLE IF NOT EXISTS sms_lead_state (
  slug TEXT PRIMARY KEY,
  normalized_phone TEXT,
  sms_status TEXT NOT NULL DEFAULT 'pending',
  sms_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  sms_sent_at TIMESTAMPTZ,
  sms_last_error TEXT,
  sms_message_id TEXT,
  sms_reply_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sms_lead_state_status_idx
  ON sms_lead_state (sms_status);

CREATE INDEX IF NOT EXISTS sms_lead_state_phone_idx
  ON sms_lead_state (normalized_phone);

CREATE TABLE IF NOT EXISTS sms_inbound (
  id BIGSERIAL PRIMARY KEY,
  provider_message_id TEXT UNIQUE,
  from_phone TEXT NOT NULL,
  to_phone TEXT,
  body TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  slug TEXT,
  matched BOOLEAN NOT NULL DEFAULT FALSE,
  is_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  normalization_failed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sms_inbound_from_phone_idx
  ON sms_inbound (from_phone);

CREATE INDEX IF NOT EXISTS sms_inbound_slug_idx
  ON sms_inbound (slug);

ALTER TABLE sms_inbound ADD COLUMN IF NOT EXISTS normalization_failed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS sms_opt_outs (
  phone TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`.trim();

/**
 * Website factory worker state (discovery progress, leases, run metrics).
 * Durable on Neon — never rely on the Vercel ephemeral filesystem.
 */
export const FACTORY_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS factory_discovery_progress (
  id TEXT PRIMARY KEY DEFAULT 'default',
  progress JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS factory_worker_lease (
  id TEXT PRIMARY KEY DEFAULT 'default',
  run_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'claimed',
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS factory_worker_runs (
  run_id TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL,
  trigger_source TEXT NOT NULL,
  status TEXT NOT NULL,
  actionable_before INT,
  actionable_after INT,
  target INT,
  needed INT,
  demos_generated INT NOT NULL DEFAULT 0,
  demos_published INT NOT NULL DEFAULT 0,
  demos_failed INT NOT NULL DEFAULT 0,
  publish_commit_sha TEXT,
  error TEXT,
  metrics JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS factory_worker_runs_started_idx
  ON factory_worker_runs (started_at DESC);

CREATE TABLE IF NOT EXISTS factory_generation_locks (
  slug TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS factory_generation_locks_status_idx
  ON factory_generation_locks (status, updated_at);
`.trim();

/**
 * Demo lifecycle and lightweight view tracking (Neon only).
 */
export const DEMO_LIFECYCLE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS demo_lifecycle (
  slug TEXT PRIMARY KEY,
  lifecycle_status TEXT NOT NULL DEFAULT 'generated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0,
  purchased_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS demo_lifecycle_status_idx
  ON demo_lifecycle (lifecycle_status);

CREATE INDEX IF NOT EXISTS demo_lifecycle_published_at_idx
  ON demo_lifecycle (published_at);

CREATE INDEX IF NOT EXISTS demo_lifecycle_view_count_idx
  ON demo_lifecycle (view_count);

CREATE TABLE IF NOT EXISTS demo_view_dedupe (
  slug TEXT NOT NULL,
  viewer_key TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (slug, viewer_key)
);

CREATE INDEX IF NOT EXISTS demo_view_dedupe_expires_idx
  ON demo_view_dedupe (expires_at);
`.trim();

/**
 * Observational Grok QA runs. Immutable after completed/failed.
 * Never overwrites git content; never drives lead/SMS status.
 */
export const QA_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS qa_runs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  factory_run_id TEXT,
  trigger TEXT NOT NULL,
  run_status TEXT NOT NULL,
  policy_status TEXT,
  score INT,
  summary TEXT,
  result_json JSONB,
  model TEXT,
  input_tokens INT,
  output_tokens INT,
  estimated_cost_usd NUMERIC,
  attempt INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 2,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS qa_runs_slug_created_idx
  ON qa_runs (slug, created_at DESC);

CREATE INDEX IF NOT EXISTS qa_runs_status_retry_idx
  ON qa_runs (run_status, next_retry_at);

CREATE INDEX IF NOT EXISTS qa_runs_slug_hash_idx
  ON qa_runs (slug, content_hash);

CREATE TABLE IF NOT EXISTS qa_run_lease (
  slug TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'claimed',
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`.trim();
