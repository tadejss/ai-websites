# Domain model

> **Verified against code:** 2026-09-01  
> **Source of truth:** types + stores listed per entity (`src/leads/store.ts`, `src/db/schema.ts`, `src/onboarding/types.ts`, `src/outreach/sms/types.ts`, `src/content/site-config.schema.json`). Individual lead/client JSON files are **not** documented.  
> **Stale / unverified:** none for the contracts below. Production row counts: UNKNOWN.

Slug is the join key across lead, client folder, customer, onboarding, SMS, and demo lifecycle.

**lead ≠ client ≠ customer.** **generate ≠ publish.** **demo URL = LIVE URL** (`/{slug}`). `/demo/{slug}` is a middleware rewrite, not a second site.

---

## Distinctions the code enforces

| Concept | Identity | Storage | Exists when |
|---------|----------|---------|-------------|
| **Lead** | Sales prospect, `slug` | git `src/content/leads/{slug}.json` | After discovery; may exist without a site |
| **Client** | Generated website content | git `src/content/clients/{slug}/` | After `generateClient()` |
| **Customer** | Paying subscriber | Neon `customers` | After Stripe base checkout webhook |

- `isCustomer(slug)` reads Neon only (`src/customers/store.ts`), not lead JSON.
- Admin display: DB customer wins (`resolveAdminLeadStatus` in `src/admin/leads-filters.ts`).
- `getLeadWithCustomerState` (`src/customers/merge.ts`): DB wins for `status`, Stripe IDs, plan, `purchasedAt`, upsells.
- Onboarding requires customer row + token (`src/onboarding/auth.ts`).
- SMS uses `getCustomerSlugSet()` / `isCustomer()`, with legacy fallback `lead.status === "customer"` (`evaluateSmsEligibility`).

---

## DEMO vs LIVE

| Fact | Code |
|------|------|
| URL | `/{slug}` (`src/leads/demo-url.ts` → `toAbsoluteUrl('/{slug}')`). Same after LIVE. |
| Rewrite | `/demo/{slug}` → `/{slug}` (`src/middleware.ts`) |
| Rendered JSON | Always `getSiteConfig(slug)` → `clients/{slug}/site.json` |
| Chrome | Non-customer + not `zbrendiraj`: `DemoPurchaseBar`. Customer: `CustomerPreparingBar` until `onboardingStatus === "live"` (`src/app/site-page.tsx`, `CustomerPreparingBar.tsx`) |
| LIVE meaning | `customer_onboarding.status === "live"` after `publishCustomerSite` rewrote git |
| Pre-customer snapshot | First apply copies to `clients/{slug}/demo/` (`snapshotDemoIfNeeded` in `apply-customer-site.ts`). Archive only — not a public route |

---

## Lead

**Purpose:** Sales pipeline record (discovery metadata, notes, email outreach history, legacy Stripe fields).

**Where:** `src/content/leads/{slug}.json`  
**Type:** `LeadRecord` in `src/leads/store.ts`

**Key fields:** `slug`, `url`, `googlePlaceId`, `companyName`, `industry`, `phone`, `email`, `address`, Google rating/reviews, `existingWebsite`, `status`, `notes`, `sourceQuery`, `outreach`, `contactHistory`, optional Stripe/upsell fields.

**Statuses** (`LEAD_STATUSES` in `src/leads/statuses.ts`):  
`discovered` → `generated` → `contacted` → `followup_1` → `followup_2` → `replied` | `interested` | `not_interested` | `customer` | `rejected` | `do_not_contact`

**Writers:** `discover.ts` (`saveLead`), `generate-client.ts` (status `generated`), email `outreach/send.ts` (`statusAfterOutreachStep` + `patchLead`). Stripe webhook does **not** write lead JSON.

**Readers:** admin, SMS eligibility, `readLead`, `getLeadWithCustomerState`, `resolveCheckoutLead`.

**`SALES_OWNED_FIELDS`** (`saveLead` merge): `status`, `notes`, `contactHistory`, `email`, `outreach`, Stripe/upsell fields. Existing sales values win except `status === "discovered"` (generation may advance) and empty email may be filled.

**Status:** Implemented for discovery/outreach. Payment fields on JSON: **legacy / Partial** — Neon is SoT when `DATABASE_URL` is set.

**Example (shape only):**

```ts
{ slug: "example-salon", companyName: "…", status: "generated", phone: "+386…",
  outreach: { initialSentAt: "…" }, stripeCustomerId?: "cus_…" } // legacy; DB wins when merged
```

---

## Client / demo site

**Purpose:** Git-backed website the app renders.

**Where:**

| File | Type | Writer | Reader |
|------|------|--------|--------|
| `clients/{slug}/site.json` | `SiteConfig` | `generate-client.ts`, `apply-customer-site.ts` | `get-site-config.ts` |
| `clients/{slug}/business.json` | `BusinessInput` (`src/ai/types.ts`) | same | checkout-lead, onboarding prefill/process, email resolve |
| `clients/{slug}/demo/` | snapshot | first `applyCustomerSite` | not served |

**Index:** webpack `require.context` on `**/site.json` (`src/content/clients/index.ts`). Legacy loader `src/content/sites/{slug}.json` still exists; live default is `clients/default/site.json`.

**No client-level status enum.** “Demo content” = `site.json` before customer publish; “LIVE content” = post-`applyCustomerSite` `site.json`.

**Status:** Implemented. `demo/` snapshot is Partial (archive only).

---

## Customer

**Purpose:** Paid subscriber.

**Where:** Neon `customers` (`src/db/schema.ts`, `src/customers/store.ts`)

**Key fields (`CustomerRecord`):** `slug` PK, `status` (always `"customer"`), `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionPlan` (`monthly` \| `yearly`), `purchasedAt`.

**Writers:** `upsertCustomerFromCheckout` from Stripe webhook.  
**Readers:** `isCustomer`, admin `getCustomerSlugSet`, merge layer, checkout 409 if already customer, onboarding auth.

**Status:** Implemented when DB configured; degrades without `DATABASE_URL`.

**Missing:** subscription cancel / churn — webhook handles `checkout.session.completed` only (`src/app/api/webhooks/stripe/route.ts`). Cancelled Stripe subs stay `isCustomer === true`.

---

## Purchase / upsell

**Where:** Neon `customer_purchases`

**Kinds:** `base_subscription` | `upsell`. Unique indexes: `stripe_checkout_session_id`; `(slug, upsell_type)` where upsell_type IS NOT NULL.

**Wired upsells** (`src/billing/upsells.ts`): `google_business`, `seo`, `professional_email`. Checkout: `POST /api/checkout/upsell`. Webhook: `handleUpsellCompleted` → `recordCustomerUpsellPurchase`. Read: `src/leads/upsell-store.ts` (DB first, lead JSON fallback).

**Unwired:** `src/billing/addons.ts` (`CHECKOUT_ADDONS`) — **no other imports**. Partial/stub.

**Status:** Upsells Implemented. Addons Missing from checkout.

---

## Onboarding

**Purpose:** Post-purchase questionnaire, admin approval, git publish.

**Where:** Neon `customer_onboarding` + mutex `customer_publish_lease`

**Statuses** (`ONBOARDING_STATUSES` in `src/onboarding/types.ts`):

```
pending → in_progress (saveOnboardingDraft)
       → submitted (submitOnboarding)
       → processing → ready_for_approval (processOnboardingSubmission)
       → approved_for_publish (approveOnboardingForPublish)
       → publishing (beginCustomerPublish)
       → live (markCustomerPublished) | publish_failed (markCustomerPublishFailed)
```

Locked for customer edits (`isOnboardingLockedForCustomerEdits`): `approved_for_publish`, `publishing`, `publish_failed`, `live`.

**Token:** `ensureOnboardingAccess` creates `access_token` once (never rotated). URL `/{slug}/vsebina?token=…`. Timing-safe compare in `isValidOnboardingToken`.

**`processed_payload`:** `{ slug, mergedAt, businessInput, siteHints }` — Neon only until `applyCustomerSite`.

**Do not duplicate** the API list: [ONBOARDING.md](./ONBOARDING.md).

**Status:** Implemented end-to-end when DB + git publish env exist. Dispatch on approve is **Partial** (needs `FACTORY_DISPATCH_ENABLED`).

---

## SMS queue / opt-out / inbound

**Purpose:** Outbound queue + per-lead SMS state. Lead identity stays in git JSON.

**Where:** Neon `sms_messages`, `sms_lead_state`, `sms_inbound`

**Message statuses:** `queued` → `claimed` → `sending` → `sent` | `failed` | `cancelled`  
(`insertQueuedMessage`, `claimQueuedMessages`, `markMessageSending`, `applyMessageResult` in `src/outreach/sms/store.ts`)

**Lead SMS statuses:** `pending`, `queued`, `sending`, `sent`, `failed`, `replied`, `opted_out`

**Steps:** `initial` | `followup_1` | `followup_2` | `manual` (`SmsStep`)

**Opt-out** (`src/outreach/sms/opt-out.ts` + `inbound.ts`): keywords include `stop`, `odjava`, `ne` (whole message), `preklic`, `unsubscribe`. Sets `smsStatus: "opted_out"`, `smsAllowed: false`. Enqueue never re-enables.

**Idempotency:** unique index on `(slug, step)` while status in `queued|claimed|sending|sent`.

**Eligibility:** `evaluateSmsEligibility` (`src/outreach/sms/eligibility.ts`). Generation gate: `isSmsGenerationCandidate` (`relevance.ts`) — no website + SI mobile.

Details: [SMS_OUTREACH.md](./SMS_OUTREACH.md).

**Status:** Implemented when DB configured.

---

## SiteConfig

**Contract:** `src/content/site-config.schema.json` (`additionalProperties: false`)

**Required:** `brand`, `metadata`, `nav`, `hero`, `services`, `whyChooseUs`, `contact`, `footer`

**Optional:** `appearance`, `sections`, `gallery`, `pricing`, `theme`, `layout`, `images`, `business`, `privacy`

**Runtime validator:** `validateSiteConfig` (`src/content/validate-site-config.ts`) — Zod; defaults `appearance ?? "default"`; may derive `business` + `privacy`.

**Status:** Implemented (JSON Schema + Zod). Runtime defaults soften some schema strictness.

---

## Appearance / theme / layout

**Appearance IDs** (`src/appearances/types.ts`): `default`, `beauty`, `zbrendiraj`, `elektro`, `construction`, `cleaning`, `health`, `auto`

**Registry:** `src/appearances/registry.ts` — trade IDs share `TradeSitePage`.

**Assignment at generation:** `appearanceForIndustry(industry + companyName)` (`industry-appearance.ts`). **`zbrendiraj` is never returned.** Runtime: `resolveAppearance` falls back to `default`.

**Theme:** `assignTheme(slug, appearance)` — hash palette + font; collision avoidance via `getUsedThemePairs()`.

**Layout:** beauty `assignBeautyLayout`; trade `assignTradeLayout`. Stored on `SiteConfig.layout.profileId`.

**Status:** Implemented.

---

## Image

**Generation:** `generateSiteImages` (`src/images/generate-site-images.ts`) — pool first, else Pexels → Unsplash.

**Pool ingest:** Pexels only (`src/images/image-pool.ts`). Unsplash in pool: **Missing**.

**Storage:** Vercel Blob if `BLOB_READ_WRITE_TOKEN` or Vercel OIDC; else `public/clients/` and `public/stock/` (`src/images/storage.ts`). Formats: AVIF + WebP (`optimize-image.ts`).

**URLs** live in `site.json` `images` block (hero + services slots).

**Status:** Implemented; skipped with warning if no stock API keys.

---

## Demo lifecycle (analytics)

**Where:** Neon `demo_lifecycle`, `demo_view_dedupe`

**Statuses:** `generated` → `published` → `viewed` → `purchased` (`src/demo-lifecycle/types.ts`)

**Writers:** generation lock (`upsertDemoLifecycleGenerated`), factory publish (`markDemoLifecyclePublished`), `recordDemoView` on slug page, Stripe webhook (`markDemoLifecyclePurchased`).

**Excluded slugs:** `zbrendiraj-si`, `default`, `test` (`excluded-slugs.ts`). Customers skipped.

**Status:** Implemented (Vercel request-time). No-op without DB. **Not** used for unconverted cleanup (no delete path).

---

## Factory worker state

Neon: `factory_discovery_progress`, `factory_worker_lease` (singleton), `factory_worker_runs`, `factory_generation_locks`. See [FACTORY.md](./FACTORY.md).

---

## Dual-store map

| Data | Git JSON | Neon | SoT |
|------|----------|------|-----|
| Lead discovery/sales | `leads/{slug}.json` | — | Git |
| Site content | `clients/{slug}/site.json` | — | Git (after publish) |
| Customer/payment | legacy fields on lead | `customers`, `customer_purchases` | Neon |
| Onboarding | — | `customer_onboarding` | Neon |
| SMS | — | `sms_*` | Neon |
| Demo views | — | `demo_lifecycle` | Neon |
| Factory worker | — | `factory_*` | Neon |

---

## Open questions

- Whether any production customers exist with `lead.status === "customer"` written by old code vs overlay-only.
- Whether `demo/` snapshots are ever read back by tooling besides apply — UNKNOWN beyond `snapshotDemoIfNeeded`.
