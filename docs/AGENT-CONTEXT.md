# Agent context — ai-websites

> **Verified against code:** 2026-09-01
> **Source of truth:** the TypeScript in `src/`, `scripts/`, `tools/sms-gateway/`, `.github/workflows/`, `vercel.json`, `package.json`. This file is an index, not a substitute.
> **Stale / unverified:** whether production Vercel has `FACTORY_DISPATCH_ENABLED=true` and whether GitHub has `FACTORY_GIT_TOKEN` — code default is `dispatchEnabled: false` (`src/factory/config.ts` → `getFactoryWorkerConfig`).

Read this first. Then open the one linked file for the task. Do not rediscover the factory from filenames.

---

## Product (8 lines)

**zbrendiraj.si** is a Next.js 16 App Router monolith that sells AI-generated websites to Slovenian SMBs.

1. Discover local trades without a website (Google Places, 12 regions × 16 professions).
2. Generate a demo (`site.json` + `business.json` + images) and publish it to git so Vercel can serve `/{slug}`.
3. SMS the owner a demo link (Neon queue + local HiLink modem — never from Vercel).
4. Stripe Checkout (monthly/yearly) → Neon `customers` + onboarding token.
5. Customer fills `/{slug}/vsebina`; admin approves; GitHub Action applies payload and git-pushes LIVE content.
6. Same URL before and after purchase. Chrome swaps: `DemoPurchaseBar` → `CustomerPreparingBar` → none when `onboardingStatus === "live"`.
7. Generation and git publish **do not run on Vercel** (ephemeral FS). They run on GitHub Actions or a local CLI.
8. Brand site is the client slug `zbrendiraj-si` with appearance `zbrendiraj`, mapped from hosts `zbrendiraj.si` / `www.zbrendiraj.si`.

---

## Which doc for which question

| Question | Read |
|----------|------|
| Start here / traps / never-do | this file |
| Components, environments, data stores | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Entities, statuses, who writes what | [DOMAIN.md](./DOMAIN.md) |
| Discover → generate → SMS → checkout → LIVE | [FACTORY.md](./FACTORY.md) |
| SiteConfig load, routing, appearances, images | [CONTENT-AND-RENDERING.md](./CONTENT-AND-RENDERING.md) |
| Env, crons, auth, gateway, deploy, CLI env | [RUNTIME-AND-OPS.md](./RUNTIME-AND-OPS.md) |
| Rules you must not break | [INVARIANTS.md](./INVARIANTS.md) |
| Term A vs term B | [GLOSSARY.md](./GLOSSARY.md) |
| Stripe prices, webhook, upsells | [CHECKOUT.md](./CHECKOUT.md) |
| Onboarding statuses, APIs, approve → publish | [ONBOARDING.md](./ONBOARDING.md) |
| SMS queue, gateway, opt-out | [SMS_OUTREACH.md](./SMS_OUTREACH.md) (replenish section is stale — use FACTORY.md) |
| Email cold outreach | [OUTREACH.md](./OUTREACH.md) — **Legacy**. Cron is skipped. |
| Schema field shapes for AI | [AI_GENERATION.md](./AI_GENERATION.md) — output path `sites/{slug}.json` is **legacy** |
| Privacy/legal page contract | [PRIVACY.md](./PRIVACY.md) — contact is Resend, not SMTP |
| Cost/reliability of generation | [FACTORY-COST-RELIABILITY-AUDIT.md](./FACTORY-COST-RELIABILITY-AUDIT.md) |
| Old factory roadmap (churn/cleanup still Missing) | [WEBSITE-FACTORY-PLAN.md](./WEBSITE-FACTORY-PLAN.md) — LIVE/views/worker claims are stale |
| Duplicate 2026-08 snapshot | [ARCHITECTURE-REPORT.md](./ARCHITECTURE-REPORT.md) — prefer ARCHITECTURE.md |

Next.js in this repo is **16.3.0**. Docs live in `node_modules/next/dist/docs/`. Middleware is still `src/middleware.ts` (Next 16 docs call this Proxy / `proxy.ts`; this repo has not renamed).

---

## Common tasks → start file

| Task | Start here | Then |
|------|------------|------|
| Add an appearance | `src/appearances/types.ts` (`APPEARANCE_IDS`) | `registry.ts`, Zod enum in `src/content/validate-site-config.ts`, optional `industry-appearance.ts` |
| Change SMS copy | `src/outreach/sms/templates.ts` | eligibility: `src/outreach/sms/eligibility.ts` |
| Fix checkout | `src/app/api/checkout/route.ts` | `src/billing/stripe.ts`, [CHECKOUT.md](./CHECKOUT.md) |
| New CLI script | `scripts/` + `package.json` `scripts` | do not add a Vercel cron unless the work is request-safe |
| Onboarding status / LIVE | `src/onboarding/types.ts` | [ONBOARDING.md](./ONBOARDING.md), `src/onboarding/publish-customer.ts` |
| Replenish demos (with git push) | `src/factory/worker.ts` → `runFactoryWorker` | **not** `npm run replenish-leads` (that does not commit) |
| Discovery matrix / regions | `src/leads/discovery-matrix.ts` | `discovery-regions.ts`, `discovery-professions.ts` |
| SiteConfig schema | `src/content/site-config.schema.json` | `validate-site-config.ts` + generator + a real `site.json` |
| Admin UI | `src/app/admin/` | auth: `src/middleware.ts`, `src/lib/auth.ts` |
| SMS eligibility / opt-out | `src/outreach/sms/eligibility.ts` | `opt-out.ts`, `inbound.ts` |

---

## Where truth lives

| Concern | Store | Writer |
|---------|-------|--------|
| Lead identity + sales notes | git `src/content/leads/{slug}.json` | discovery, `generate-client.ts`, email outreach `patchLead` |
| Demo / LIVE page content | git `src/content/clients/{slug}/site.json` | `generateClient`, `applyCustomerSite` (publish only) |
| Business facts for gen/onboard | git `src/content/clients/{slug}/business.json` | same |
| Paying customer | Neon `customers` | Stripe webhook `upsertCustomerFromCheckout` |
| Purchases / upsells | Neon `customer_purchases` | webhook; unique on `stripe_checkout_session_id` |
| Onboarding + `processed_payload` | Neon `customer_onboarding` | onboarding API; **does not** write git until publish |
| SMS queue / opt-out | Neon `sms_*` | cron enqueue + gateway result/inbound |
| Discovery progress | Neon `factory_discovery_progress` when `DATABASE_URL` set; else `data/lead-discovery-progress.json` | factory worker / `replenish-leads` |
| Factory leases / run metrics | Neon `factory_*` | `src/factory/lease.ts` |
| Demo views | Neon `demo_lifecycle` | `recordDemoView` on `/{slug}` |
| Production images | Vercel Blob (fallback `public/` locally) | image pipeline + onboarding upload |
| Image pool cache / Unsplash limiter | gitignored `data/*.json` | local/GHA generation |
| Money | Stripe | Checkout Sessions; webhook is the app's commit point |

Neon **must not** silently overwrite `site.json`. The only git write of customer content is `applyCustomerSite` inside `publishCustomerSite`.

---

## Traps (easy to get wrong)

- **ICP / slot-yield is Obsolete.** Matrix path is `discovery-matrix.ts`. `src/leads/icp.ts` and `slot-yield.ts` have no replenish imports. Do not "fix" them.
- **Email cold outreach is Legacy.** `/api/cron/outreach` returns `{ skipped: true }`. SMS is the automated channel. Admin/CLI email still exists (`src/outreach/send.ts`).
- **`/api/cron/replenish-leads` does not generate.** It reports backlog and *may* `dispatchFactoryWorker` if `FACTORY_DISPATCH_ENABLED` + GitHub creds. Default dispatch is off.
- **`npm run replenish-leads` does not git push.** `npm run factory-worker` does (when `FACTORY_PUBLISH_ENABLED`).
- **A demo is invisible on production until git push + Vercel build.** Configs are bundled via webpack `require.context` in `getSiteConfig`.
- **`SITE_SLUG` is local-dev only** (`dev:default`, `dev:test`). Prod routing is URL slug / custom domain.
- **`src/db/schema.sql` lags `src/db/schema.ts`.** Runtime applies `schema.ts` via `ensureCustomerSchema()`.
- **`lead.status === "customer"` is not what Stripe writes.** Webhook writes Neon; `getLeadWithCustomerState` overlays DB at read time. SMS also treats Neon `isCustomer()`.
- **`/{slug}` and `/demo/{slug}` are the same page** (middleware rewrite). LIVE is not a new path.
- **`zbrendiraj` appearance is never auto-assigned** (`appearanceForIndustry` never returns it).
- **`billing/addons.ts` is unwired.** Upsells are `src/billing/upsells.ts`.
- **Next 16 Proxy rename:** keep `src/middleware.ts` until the project migrates; do not add a second `proxy.ts`.

---

## Never do

- Mass-edit generated `src/content/clients/*/site.json` or lead JSON (except targeted ops scripts).
- Commit `.env*`, `data/` caches, `logs/`, `tools/sms-gateway/.env`, or `public/clients/**/*.avif|webp`.
- Change `site-config.schema.json` without updating Zod validator, generator prompts, and at least one real config.
- Register an appearance only in a folder — must hit `APPEARANCE_IDS` + registry + Zod enum.
- Send SMS outside queue + `evaluateSmsEligibility` + opt-out (`smsAllowed` / `opted_out`).
- Handle Stripe events without session-id idempotency (`customer_purchases_session_uidx`).
- Treat `schema.sql` or old docs as newer than code.
- Run generation on Vercel / in a Route Handler that writes the git tree.

---

## Open questions

- Is `FACTORY_DISPATCH_ENABLED` actually true in production Vercel? Code default: false.
- Is `secrets.FACTORY_GIT_TOKEN` set on GitHub? Workflow falls back to `github.token`.
- Production `AI_PROVIDER` value (`openai` default in `src/ai/providers/index.ts`).
