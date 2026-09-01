# Runtime and operations

> **Verified against code:** 2026-09-01  
> **Source of truth:** `vercel.json`, `src/lib/auth.ts`, `src/factory/config.ts`, `package.json`, `.github/workflows/`, `tools/sms-gateway/`, `process.env` reads in `src/` / `scripts/` / `tools/sms-gateway/`.  
> **Stale / unverified:** actual production env **values** (never document those). Whether dispatch secrets are set.  
> **Never print `.env` contents.**

---

## Environments

| Environment | Runs |
|-------------|------|
| **Vercel** | Next.js app, API routes, crons (enqueue SMS; replenish status/dispatch), webhooks, admin, demo view writes |
| **GitHub Actions** | `factory-worker.yml` (generate + git push); `customer-publish.yml` (LIVE apply + git push) |
| **Local CLI** | `tsx scripts/*` — generation, backfills, tests; `factory-worker` if you have DB + git |
| **Local SMS gateway** | `tools/sms-gateway` + Huawei HiLink — **never** on Vercel |
| **Neon** | Shared by Vercel, GHA, and local when `DATABASE_URL` is set |

Next.js **16.3.0**, React 19, App Router in `src/app/`. Route Handlers use `runtime = "nodejs"` + `dynamic = "force-dynamic"` where present. React Compiler is on (`next.config.ts`). Middleware file is still `src/middleware.ts` (docs say `proxy.ts`).

---

## Env vars (names only)

### Required prod (Vercel)

| Variable | Where |
|----------|-------|
| `DATABASE_URL` (or `POSTGRES_URL`, `POSTGRES_PRISMA_URL`) | `src/db/client.ts` → `getDatabaseUrl` |
| `CRON_SECRET` | `getCronSecret` — Bearer for `/api/cron/*` |
| `ADMIN_SECRET` | cookie + admin APIs |
| `SMS_GATEWAY_SECRET` | SMS gateway ↔ prod API |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | billing + webhook |
| `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` | `getPriceIdForPlan` |
| `STRIPE_PRICE_UPSELL_GOOGLE_BUSINESS`, `STRIPE_PRICE_UPSELL_SEO`, `STRIPE_PRICE_UPSELL_EMAIL` | upsells |
| `RESEND_API_KEY` | transactional email |
| `DEMO_VIEW_HASH_SECRET` | required in prod for view dedupe (`viewer-key.ts`; dev fallback if unset) |

Without `DATABASE_URL`, Stripe webhook cannot persist customers (503). Schema is applied on first use (`ensureCustomerSchema`).

### Factory / GHA / local worker

| Variable | Default | Notes |
|----------|---------|-------|
| `FACTORY_WORKER_ENABLED` | `true` | Worker no-ops unless true (or `force`) |
| `FACTORY_PUBLISH_ENABLED` | `true` | If false, git add/commit/push skipped |
| `FACTORY_DISPATCH_ENABLED` | **`false`** | Vercel cron/approve → GHA |
| `FACTORY_GITHUB_REPO`, `FACTORY_GITHUB_TOKEN` | null | Required for dispatch |
| `FACTORY_GIT_BRANCH` | `main` | |
| `FACTORY_GIT_REMOTE` | `origin` | |
| `FACTORY_WORKER_LEASE_MINUTES` | `90` | |
| `FACTORY_WORKER_COOLDOWN_MINUTES` | `30` | |
| `FACTORY_WORKER_MAX_CONSECUTIVE_FAILURES` | `5` | |
| `FACTORY_GENERATION_RETRY_MINUTES` | `60` | |
| `FACTORY_WORKER_ID`, `FACTORY_TRIGGER_SOURCE` | — | CLI/GHA labels |
| `GOOGLE_PLACES_API_KEY` | — | discovery + details |
| `DISCOVERY_MAX_SEARCHES_PER_RUN` | `80` | |
| `DISCOVERY_ZERO_YIELD_COMPLETION_STREAK` | `3` | |
| `SMS_LEAD_TARGET` | `500` | |
| `SMS_LEAD_REPLENISH_BATCH` | `100` | |
| `BLOB_READ_WRITE_TOKEN` | — | local/GHA Blob writes |
| `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY` | — | images |
| `IMAGE_ASSET_CACHE_PATH` | `data/image-asset-cache.json` | |

GHA secrets referenced in YAML (not in app TS): `FACTORY_GIT_TOKEN`, plus the keys above.

### SMS (prod + gateway)

| Variable | Side |
|----------|------|
| `SMS_GATEWAY_SECRET` | both |
| `SMS_DAILY_LIMIT`, `SMS_MIN_DELAY_MS`, `SMS_BATCH_SIZE` | both (defaults 100 / 3000 / 5) |
| `SMS_CLAIM_LEASE_MINUTES` | Vercel (default 10) |
| `SMS_GATEWAY_LOCAL_SECRET` | **Local-only** (required by gateway) |
| `SMS_API_BASE_URL` | Local-only, default `https://zbrendiraj.si` |
| `SMS_DRY_RUN`, `SMS_POLL_INTERVAL_MS`, `SMS_GATEWAY_PORT`, `SMS_GATEWAY_AUTOPOLL` | Local-only |
| `HILINK_URL` | Local-only, default `http://192.168.8.1` |

### Billing / email

`STRIPE_TAX_RATE_ID`; `STRIPE_PRICE_ADDON_*` (addons **unwired**); `CHECKOUT_NOTIFY_EMAIL`; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID` (zbrendiraj pricing table only); `OUTREACH_FROM_EMAIL`, `OUTREACH_FROM_NAME`, `OUTREACH_DRY_RUN`, `OUTREACH_BATCH_SIZE`, `OUTREACH_FOLLOWUP_*_DAYS`; `RESEND_WEBHOOK_SECRET` / `RESEND_SIGNING_SECRET`.

### AI

`AI_PROVIDER` (default `openai`); `OPENAI_API_KEY`; `GEMINI_API_KEY`; `GEMINI_MIN_REQUEST_INTERVAL_MS` (default 4100); `GEMINI_MAX_429_RETRIES` (default 3).

### Optional / platform

`SITE_SLUG` (local); `SITE_URL` / `NEXT_PUBLIC_SITE_URL` (`src/site-url.ts`); `VERCEL`, `VERCEL_URL`; `BLOB_STORE_ID`, `VERCEL_OIDC_TOKEN`; `DEMO_VIEW_DEDUPE_HOURS`; `NODE_ENV`; `MAX_GENERATIONS_PER_RUN` (batch scripts).

---

## Crons

### `vercel.json` (Vercel-only)

| Path | UTC schedule | What the route **does** |
|------|----------------|-------------------------|
| `/api/cron/sms-outreach` | `0 9 * * *` | `enqueueDueSmsBatch()` — writes Neon queue; **does not** send SMS |
| `/api/cron/replenish-leads` | `0 6 * * *` | `getReplenishStatus()`; maybe `dispatchFactoryWorker()` |

Auth: `Authorization: Bearer CRON_SECRET` (`isValidCronToken`).

### Exists but not in `vercel.json`

`/api/cron/outreach` — returns `{ skipped: true }` (email disabled).

### GitHub Actions (not Vercel cron)

`factory-worker.yml`: `30 6 * * *` + `repository_dispatch: factory-generate` + `workflow_dispatch`. Concurrency group `factory-worker`, `cancel-in-progress: false`, timeout 360 minutes.

`customer-publish.yml`: `repository_dispatch: customer-publish` + `workflow_dispatch` with `slug`.

---

## Admin auth

- Pages: `src/middleware.ts` — `/admin/*` except login requires cookie `admin_session` === `ADMIN_SECRET` (`isValidAdminToken`). No secret → 503.
- Login: `loginAction` in `src/app/admin/login/page.tsx` sets that cookie (`secure` in production).
- Admin APIs: `isAdminAuthorized()` (`src/lib/admin-auth.ts`) — Bearer **or** cookie.
- Constant-time compare in `src/lib/auth.ts`.

No RBAC. Single shared password.

---

## SMS gateway

**Local-only.** Package under `tools/sms-gateway/`. Env file `tools/sms-gateway/.env` (gitignored).

`poller.ts` `apiFetch`: `Authorization: Bearer SMS_GATEWAY_SECRET` to `SMS_API_BASE_URL`.

- `GET /api/outreach/sms/queue`
- `POST /api/outreach/sms/result`
- `POST /api/outreach/sms/inbound`

Local HTTP server binds `127.0.0.1:SMS_GATEWAY_PORT` (default 8787) with `SMS_GATEWAY_LOCAL_SECRET`. Autopoll if `SMS_GATEWAY_AUTOPOLL=true`.

Loop: claim → `modem.sendSms` (HiLink or dry-run) → report → inbound poll → sleep `SMS_POLL_INTERVAL_MS` (default 15s).

---

## API inventory

| Route | Auth |
|-------|------|
| `/api/cron/*` | `CRON_SECRET` Bearer |
| `/api/outreach/sms/*` | `SMS_GATEWAY_SECRET` Bearer |
| `/api/admin/*` | Admin cookie or Bearer |
| `/api/onboarding/[slug]` | onboarding token |
| `/api/onboarding/[slug]/upload` | token + Blob configured |
| `/api/checkout`, `/api/checkout/upsell` | public (validated) |
| `/api/contact` | public + in-memory IP rate limit (5/min) |
| `/api/webhooks/stripe` | Stripe signature |
| `/api/webhooks/resend` | Svix **if** secret set; **skipped if unset** |

---

## Deploy

1. Ordinary `git push` to the connected branch → Vercel `next build` (all `site.json` bundled).
2. Factory worker push: `gitPublishPaths` on `src/content/leads` + `src/content/clients` → same Vercel rebuild.
3. Customer publish: writes `src/content/clients/{slug}` then same git helper. Commit message `customer: publish LIVE site for {slug}`.

`schema.sql` is for humans/SQL editors. Runtime DDL is `src/db/schema.ts`. **`schema.sql` lags** (no factory/demo_lifecycle/publish lease).

---

## Gitignore (do not commit)

`.env*`, `/logs`, `data/lead-discovery-progress.json`, `data/image-asset-cache.json`, `data/.unsplash-search-times.json`, `data/replenish-cursor.json`, `data/replenish-slot-yield.json`, `/public/stock/`, `/public/clients/**/*.avif|webp`, `tools/sms-gateway/.env`, `.vercel`.

`data/queries-*.txt` are **not** listed — those may be tracked.

---

## Open questions

- Production `FACTORY_DISPATCH_ENABLED` and GitHub token presence.
- Whether Vercel production cron actually hits dispatch (depends on env, not this repo).
- Cloudflare is mentioned only in privacy copy, not in deploy config — UNKNOWN if DNS is Cloudflare.
