# Factory lifecycle

> **Verified against code:** 2026-09-01  
> **Source of truth:** `src/leads/replenish.ts`, `src/factory/worker.ts`, `src/clients/generate-client.ts`, `src/app/api/cron/*`, `.github/workflows/*.yml`.  
> **Stale / unverified:** whether prod Vercel dispatch is enabled (`FACTORY_DISPATCH_ENABLED` defaults false in `src/factory/config.ts`).  
> **Do not duplicate:** [CHECKOUT.md](./CHECKOUT.md), [ONBOARDING.md](./ONBOARDING.md), [SMS_OUTREACH.md](./SMS_OUTREACH.md) (SMS mechanics). This file is the stage machine and CLI map.

```text
Discover → Generate JSON → Git publish → Vercel serves /{slug}
  → Cron enqueue SMS → local gateway sends
  → Stripe → onboard → admin approve → GHA customer-publish → same /{slug} LIVE
```

---

## Stage 1 — Discovery

| | |
|--|--|
| **Status** | Implemented (GHA / local CLI). Missing on Vercel (by design). |
| **Trigger** | `runFactoryWorker` → `replenishSmsLeads`; or `npm run replenish-leads`; standalone `npm run discover-leads` (legacy industry mode). |
| **Happy path** | Matrix cell → `buildSearchSurface` → `discoverLeads` → `saveLead` (`discovered`). |
| **Filters** | `src/leads/discover.ts`: known `googlePlaceId`, region address match, no website, SI mobile, profession `matchPattern`, usable slug. |
| **Idempotency** | `findLeadByPlaceId` + `readAllLeads()` scan. |
| **Progress** | Neon `factory_discovery_progress` via `loadDiscoveryProgress` / `saveDiscoveryProgress` when DB set; else `data/lead-discovery-progress.json`. Worker always injects Neon store. `replenishSmsLeads` defaults still point at local file until overridden. |

**Matrix:** 12 regions (`DISCOVERY_REGION_ORDER` in `discovery-regions.ts`) × 16 professions (`DISCOVERY_PROFESSION_ORDER` = `IMAGE_POOL_CATEGORY_IDS`) = **192** cells (`discovery-matrix.ts`).

**Caps** (`discovery-config.ts`): 60 Places per query; max 80 searches/run (`DISCOVERY_MAX_SEARCHES_PER_RUN`); zero-yield streak 3 (`DISCOVERY_ZERO_YIELD_COMPLETION_STREAK`). Stop reasons: `target_met`, `global_search_limit`, `all_combinations_exhausted`, Places error.

**Completion of a cell** (`shouldCompleteCombination` in `discovery-progress.ts`): streak, high-value queries exhausted, or no queries left.

**Operator:** do not reset progress (`replenish-leads --reset`) unless you intend to restart the matrix. Do not confuse with obsolete ICP files (`icp.ts`, `data/replenish-cursor.json`).

**Failure:** Places API error can halt the replenish run (`runStopReason`). Duplicates / website / non-mobile → skip with reason.

---

## Stage 2 — Demo generation

| | |
|--|--|
| **Status** | Implemented (GHA / CLI). Missing on Vercel. |
| **Trigger** | Inline from replenish: `createClientFromLead(slug)`. Also `npm run generate-lead`. Worker wraps with `tryAcquireGenerationLock`. |
| **Happy path** | `create-client-from-lead.ts` → place details → `generateClient` → `business.json` + `site.json` + images → lead `status: "generated"`. |
| **Pipeline** (`generate-client.ts`) | `validateRawBusinessData` → `generateBusinessInput` → `generateSiteConfig` → `appearanceForIndustry` + `assignTheme` + layout → `generateSiteImages` → `applyNewLeadSectionDefaults` → `validateSiteConfig`. |
| **AI retries** | One content-correction retry per text stage (`generate-business-input.ts`, `generate-site-config.ts`). Image plan is always Gemini (`build-search-queries.ts`). |
| **Idempotency** | Skip if `clientExists` / `clientSiteExists`; generation lock per slug (`factory_generation_locks`). |
| **Failure** | AI fail after retry → replenish logs `errors[]` and continues. Images optional if keys missing. |

Target: `SMS_LEAD_TARGET` default 500 actionable; per-run cap `SMS_LEAD_REPLENISH_BATCH` default 100 (`src/outreach/sms/config.ts`). Actionable count: `countActionableSmsLeads` (`relevance.ts`).

---

## Stage 3 — Demo publish (git → Vercel)

| | |
|--|--|
| **Status** | Implemented on GHA / `factory-worker`. Partial: `replenish-leads` writes files but **does not** commit (`scripts/replenish-leads.ts` log line). |
| **Trigger** | End of `runFactoryWorker` → `publishGeneratedDemos` → `gitPublishPaths` (`src/factory/publish.ts`, `git-publish.ts`). Paths: `src/content/leads`, `src/content/clients`. Message: `factory: replenish demo backlog`. |
| **Cron** | `GET /api/cron/replenish-leads` (`0 6 * * *`): status always; dispatch GHA if `needed > 0` and `FACTORY_DISPATCH_ENABLED`. GHA also has its own `30 6 * * *` safety net (`.github/workflows/factory-worker.yml`). |
| **Happy path** | Push → Vercel build bundles new `site.json` via `require.context`. Then `markGeneratedSlugsPublished`. |
| **Failure** | `FACTORY_PUBLISH_ENABLED=false` → git noop; worker treats publish failure as run `failed` and **does not** mark slugs published (locks can stay `generated`; retry with empty porcelain is a known risk — see cost audit). |
| **Operator** | Prefer `npm run factory-worker` (or GHA) over manual commit after `replenish-leads`. |

**Lease:** singleton `factory_worker_lease`; cooldown after consecutive failures (`src/factory/lease.ts`). Config: `FACTORY_WORKER_LEASE_MINUTES` default 90, cooldown 30, max consecutive failures 5.

---

## Stage 4 — Outreach SMS

| | |
|--|--|
| **Status** | Implemented. Send is Local-only (modem). Enqueue is Vercel-only cron. |
| **Trigger** | Cron `0 9 * * *` → `enqueueDueSmsBatch` (`src/outreach/sms/enqueue-batch.ts`). Admin can queue/retry. |
| **Happy path** | Eligibility → `enqueueSmsForLead` → Neon `queued` → gateway `GET /api/outreach/sms/queue` claims → HiLink send → `POST .../result`. Inbound `POST .../inbound` → reply or opt-out. |
| **Failure** | No gateway → queue piles up. Claim lease `SMS_CLAIM_LEASE_MINUTES` default 10. Daily cap `SMS_DAILY_LIMIT` default 100. |
| **Idempotency** | Unique active `(slug, step)`. Opt-out never re-enqueued. |

Copy: `src/outreach/sms/templates.ts`. Do not send from Vercel or from email `src/outreach/send.ts` as a substitute.

Email cold outreach: **Legacy** — `/api/cron/outreach` skipped. See [OUTREACH.md](./OUTREACH.md).

More: [SMS_OUTREACH.md](./SMS_OUTREACH.md).

---

## Stage 5 — Checkout + webhook

Factory interface only. Prices, tax, upsell copy: [CHECKOUT.md](./CHECKOUT.md).

| | |
|--|--|
| **Trigger** | `DemoPurchaseBar` → `POST /api/checkout`. Success URL `/{slug}/upsell?session_id=`. |
| **Webhook** | `POST /api/webhooks/stripe` — `checkout.session.completed` only. |
| **Happy path** | `upsertCustomerFromCheckout` + `ensureOnboardingAccess` + emails + `markDemoLifecyclePurchased`. |
| **Idempotency** | `customer_purchases_session_uidx` on session id. |
| **Failure** | No `DATABASE_URL` → webhook 503; customer status will not persist. |

---

## Stage 6 — Onboarding + approve + customer-publish

Details: [ONBOARDING.md](./ONBOARDING.md).

| | |
|--|--|
| **Trigger (customer)** | `/{slug}/vsebina?token=` → PATCH draft / POST submit. |
| **Trigger (ops)** | Admin approve → `dispatchCustomerPublish` (`event_type: customer-publish`). Retry route exists. CLI: `npm run publish-customer -- <slug>`. |
| **Happy path** | `processed_payload` in Neon → `applyCustomerSite` writes git → push → `live`. Preparing bar hides when live. |
| **Failure** | `publish_failed`; admin retry. Dispatch no-op if factory dispatch env unset — payload stays in Neon, site stays demo JSON. |
| **Idempotency** | `publishCustomerSite` returns `alreadyLive` if status `live`. Per-slug `customer_publish_lease`. |

**Manual operator if dispatch off:** run `publish-customer` with `DATABASE_URL` + `FACTORY_PUBLISH_ENABLED=true` and git credentials.

---

## Stage 7 — Upsell

Wired types: `google_business`, `seo`, `professional_email` (`src/billing/upsells.ts`). `POST /api/checkout/upsell` after base session. Webhook `handleUpsellCompleted`.

`src/billing/addons.ts`: **not wired**.

---

## Stage 8 — Missing vs implemented extras

| Item | Status | Evidence |
|------|--------|----------|
| Demo view tracking | **Implemented** | `recordDemoView` in `src/app/[slug]/page.tsx` |
| Factory ops dashboard | **Implemented** | `/admin/factory` → `getFactoryOpsSnapshot` |
| Churn / subscription.deleted | **Missing** | Stripe handler only `checkout.session.completed` |
| Unconverted demo cleanup | **Missing** | `isNeverViewedDemo` exists; no delete/archive job |
| Custom domain per customer | **Missing** | `custom-domains.ts` only maps zbrendiraj.si → `zbrendiraj-si` |

---

## CLI map

Do not substitute scripts. All factory scripts load `.env.local` via dotenv where noted.

| npm script | When | Needs (names) | Writes | Do not confuse with |
|------------|------|---------------|--------|---------------------|
| `factory-worker` | GHA or local full loop | `DATABASE_URL`, Places, AI, images, Blob optional; `FACTORY_WORKER_ENABLED`, `FACTORY_PUBLISH_ENABLED` | leads + clients JSON, git commit/push, Neon factory_* | `replenish-leads` |
| `replenish-leads` | Local discover+generate, inspect first | Places, AI, images; optional `DATABASE_URL` | leads + clients; progress Neon or `data/` | **no git push** |
| `discover-leads` | One-off Places search (legacy industry filter) | `GOOGLE_PLACES_API_KEY` | lead JSON | matrix replenish |
| `generate-lead` | One slug → client | AI + images + Places details | one client dir + lead status | `generate-leads` batch |
| `generate-leads` | Batch from existing leads | AI + images; `MAX_GENERATIONS_PER_RUN` | clients + `logs/` | factory-worker |
| `generate-batch` | From query file | AI | clients | discover-leads |
| `create-client` | One-off from search query | AI | one client | lead-based flow |
| `publish-customer` | LIVE apply one slug | `DATABASE_URL`, git, `FACTORY_PUBLISH_ENABLED` | `clients/{slug}/` + git push | factory-worker (demos) |
| `list-leads` / `lead-summary` / `update-lead` | Ops | optional env | `update-lead` writes lead JSON | SMS status (Neon) |
| `send-outreach` | **Legacy email** | Resend / `OUTREACH_*` | lead outreach fields | SMS cron |
| `create-site` / `new-site` / `generate-site` / `save-site` / `generate-ai-site` | **Legacy** scaffolding | AI for generate-ai-site | `src/content/sites/*.json` | factory `clients/` |
| `backfill-*` / `regenerate-images` | Migrations | varies | existing `site.json` | full regen |
| `test-*` | Local tests | varies | fixtures only | production scripts |

Dev: `dev`, `dev:default`, `dev:test` set `SITE_SLUG` locally only.

---

## Operator checklist (code-proven)

1. Keep SMS gateway running (`tools/sms-gateway`) or the Neon queue stalls.
2. Prefer GHA/`factory-worker` so demos actually reach production.
3. After purchase, customer self-serves onboarding; ops approve on `/admin/leads/[slug]`.
4. If approve does not dispatch, run `publish-customer` locally/GHA.
5. Churn: handle in Stripe Dashboard — app will keep showing customer chrome. **Missing in code.**

---

## Open questions

- Production dispatch flags (see header).
- Whether GHA `FACTORY_GIT_TOKEN` vs `github.token` can push to the branch Vercel deploys — UNKNOWN from repo alone.
- Concurrent `replenish-leads` (file) vs worker (Neon) if both run: worker uses Neon; CLI without DB uses file — they can diverge.
