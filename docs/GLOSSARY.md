# Glossary

> **Verified against code:** 2026-09-01  
> **Source of truth:** types and filenames cited.  
> **Stale / unverified:** none.

Aliases and “do not confuse with” are the point of this file.

| Term | Means | Do not confuse with |
|------|-------|---------------------|
| **zbrendiraj.si** | Production hostname / brand | Client slug `zbrendiraj-si`; appearance id `zbrendiraj` |
| **zbrendiraj-si** | Client folder + `site.json` slug for the marketing site | The hostname |
| **zbrendiraj** (appearance) | `ZbrendirajSitePage` — never auto-assigned | Other appearances |
| **ai-websites** | Git repo / npm package name | The public brand |
| **lead** | `src/content/leads/{slug}.json` — prospect | client, customer |
| **client** | `src/content/clients/{slug}/` — generated site files | paying customer |
| **customer** | Neon `customers` row after Stripe base checkout | lead.status `"customer"` (legacy overlay) |
| **slug** | URL key joining lead/client/customer/SMS | `SITE_SLUG` env (local default site only) |
| **SITE_SLUG** | Env for `next dev` when not using `/{slug}` | Production routing |
| **demo** | Pre-purchase (or pre-LIVE) site at `/{slug}` | A separate `/demo` product; `/demo/{slug}` is only a rewrite |
| **LIVE** | Onboarding status `live` after `publishCustomerSite` rewrote git | A new URL or hostname |
| **generate** | AI + images → JSON on disk (`generateClient`) | publish / git push / Vercel deploy |
| **publish** (demos) | `publishGeneratedDemos` git commit+push of leads/clients | customer LIVE publish |
| **publish** (customer) | `publishCustomerSite` apply payload + git push | Stripe “publishable key” |
| **replenish** | `replenishSmsLeads` — discover until actionable SMS backlog hits target | `factory-worker` (replenish **plus** git publish) |
| **factory worker** | `runFactoryWorker` — lease + replenish + git publish | Vercel cron (does not generate) |
| **actionable SMS lead** | Counted by `countActionableSmsLeads` — generation candidate with demo, etc. | raw discovered lead |
| **ICP** | Obsolete 26-slot rotation (`src/leads/icp.ts`) | discovery matrix |
| **slot-yield** | Obsolete companion (`slot-yield.ts`) | matrix combination stats |
| **profession** | `DiscoveryProfessionId` — 16 matrix/image-pool ids | `LeadIndustryId` in `industry-filter.ts` (legacy scripts) |
| **industry** | String on lead/businessInput; used by `appearanceForIndustry` | profession id |
| **region** | 12 SURS-style ids in `discovery-regions.ts` | legacy 2-region `region.ts` |
| **appearance** | Template family (`APPEARANCE_IDS`) | theme (palette/fonts) or layout profile |
| **theme** | `paletteId` + `fontPairingId` on SiteConfig | appearance |
| **layout** | `layout.profileId` (beauty/trade column recipes) | appearance |
| **SiteConfig** | Validated `site.json` object | `BusinessInput` / `business.json` |
| **BusinessInput** | Structured facts for generation and onboarding merge | SiteConfig |
| **SiteConfig schema** | `site-config.schema.json` + Zod | TypeScript `src/content/types/site.ts` (keep in sync) |
| **processed_payload** | Neon JSON after onboarding submit/merge | live `site.json` (not applied until publish) |
| **onboarding token** | `customer_onboarding.access_token` query param | admin session cookie |
| **admin_session** | Cookie equal to `ADMIN_SECRET` | onboarding token; cron secret |
| **CRON_SECRET** | Bearer for `/api/cron/*` | SMS gateway secret |
| **SMS_GATEWAY_SECRET** | Bearer prod API ↔ local poller | `SMS_GATEWAY_LOCAL_SECRET` (localhost server) |
| **enqueue** | Insert SMS row `queued` (Vercel cron) | sending via modem |
| **claim / lease** | Gateway takes queued rows (`claim_expires_at`) or factory singleton lease | Stripe Checkout Session |
| **opt-out** | `sms_lead_state.smsAllowed === false` / `opted_out` | lead status `do_not_contact` (git; email suppress) |
| **outreach (email)** | Legacy Resend cold email (`src/outreach/send.ts`) | SMS outreach |
| **upsell** | `google_business` / `seo` / `professional_email` after base sub | `addons.ts` (unwired) |
| **addon** | Stub in `billing/addons.ts` | upsell |
| **base subscription** | Monthly/yearly Checkout that creates `customers` | upsell session |
| **DemoPurchaseBar** | Checkout chrome on demos | CustomerPreparingBar |
| **CustomerPreparingBar** | Post-pay chrome until `live` | purchase bar |
| **demo lifecycle** | Neon funnel `generated|published|viewed|purchased` | lead.status |
| **image pool** | Cached Pexels assets reused by profession category | direct Unsplash/Pexels download |
| **Blob** | Vercel Blob storage for images | git `public/` fallback |
| **Places** | Google Places Text Search + Place Details | “placeId” on the lead |
| **matrix cell** | One `regionId:professionId` combination (192 total) | ICP slot |
| **high-value query** | `{googleTerm} {region}` + towns | optional extra terms |
| **require.context** | Webpack bundling of all `site.json` at build | runtime filesystem read (not used for clients) |
| **force-dynamic** | Route renders per request despite `generateStaticParams` | static export |
| **Proxy** | Next 16 name for Middleware | this repo’s `src/middleware.ts` (not renamed) |
| **HiLink** | Huawei USB modem HTTP API used by the gateway | a cloud SMS provider (none in code) |
| **actionable / needed / target** | Replenish math vs `SMS_LEAD_TARGET` | SMS daily send limit |
| **sales-owned fields** | Merge-protected keys on lead JSON | Neon customer columns |

---

## Open questions

- Historical alias “splet” (retired host `splet.vercel.app`) — still in redirects; no product name usage beyond that.
