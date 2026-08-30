-- Persistent customer / payment state (Neon / Vercel Postgres).
-- Canonical copy for docs / manual SQL editor runs.
-- Runtime applies the same DDL from src/db/schema.ts via ensureCustomerSchema().

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

-- SMS outreach queue (mutable state; lead identity remains in JSON files).
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sms_inbound_from_phone_idx
  ON sms_inbound (from_phone);

CREATE INDEX IF NOT EXISTS sms_inbound_slug_idx
  ON sms_inbound (slug);

