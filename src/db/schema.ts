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
`.trim();
