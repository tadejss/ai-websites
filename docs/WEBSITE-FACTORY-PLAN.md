# Website Factory Plan

> **Date:** 2026-08-31  
> **Scope:** Lead → demo → outreach → purchase → customer → upsell → churn/cleanup  
> **Constraint:** Analysis + implementation plan only. Reuse current architecture. No rewrite.  
> **Evidence base:** Live code (not stale docs). See also `docs/ARCHITECTURE.md`.

---

## 1. Current lifecycle (as implemented)

```text
[Local CLI] Discover (Places) → Lead JSON
     → Generate (AI + images) → clients/{slug}/site.json + business.json
     → Git commit + push → Vercel deploy
         ↓
[Vercel] Demo served at /{slug}  |  Cron enqueues SMS
[Local]  HiLink gateway sends SMS
         ↓
Prospect clicks demo → Stripe Checkout (monthly/yearly)
         ↓
Webhook checkout.session.completed
  → Neon customers + purchases
  → Onboarding token + welcome email
  → Optional upsells (separate Checkout)
         ↓
Customer fills /{slug}/vsebina → processed_payload in Neon
Admin “approve for publish” → email ops
         ↓
LIVE publish of customer content ……… NOT IMPLEMENTED
Cancel / churn ………………………………… NOT IMPLEMENTED
Demo view tracking ………………………… NOT IMPLEMENTED
Unconverted demo cleanup ………………… NOT IMPLEMENTED
```

### Stage-by-stage

| # | Stage | Status | Key files |
|---|-------|--------|-----------|
| 1 | Lead creation | **Implemented (CLI)** | `src/leads/discover.ts`, `replenish.ts`, `store.ts` → `src/content/leads/{slug}.json` |
| 2 | Demo generation | **Implemented (CLI)** | `create-client-from-lead.ts`, `generate-client.ts`, AI + image pipeline |
| 3 | Demo publishing | **Manual** | Git commit → Vercel deploy. Cron is status-only (`api/cron/replenish-leads`) |
| 4 | Demo viewing / tracking | **Missing** | No pageviews, click tracking, or open rates. Privacy `analytics` flag is site-config only, default off |
| 5 | Outreach | **SMS automated enqueue; send is local** | Cron `sms-outreach`; gateway `tools/sms-gateway`. Email cold outreach = manual only |
| 6 | Stripe checkout | **Implemented** | `api/checkout`, `DemoPurchaseBar` |
| 7 | Successful purchase | **Implemented** | Webhook → `upsertCustomerFromCheckout`, idempotent on session id |
| 8 | Customer provisioning | **Partial** | Onboarding token + form + Neon payload. **Does not** rewrite `site.json` or go LIVE |
| 9 | Upsells | **Implemented** | `api/checkout/upsell`, webhook `handleUpsellCompleted`, three products |
| 10 | Subscription cancellation | **Missing** | Only `checkout.session.completed` handled. No cancel/churn status |
| 11 | Unconverted demo cleanup | **Missing** | Demos accumulate in git forever |

---

## 2. Persistence map (today)

| Concern | Store | Notes |
|---------|-------|-------|
| Lead pipeline metadata | Git `src/content/leads/*.json` | Status, notes, email outreach history |
| Demo site content | Git `src/content/clients/{slug}/` | Bundled at build via `require.context` |
| Discovery progress | Local `data/lead-discovery-progress.json` | Gitignored; not on Vercel |
| Image pool cache | Local `data/image-asset-cache.json` | Gitignored |
| Stock/client images | Vercel Blob (prod) or `public/` | |
| Paying customer | Neon `customers` | Authoritative over lead stripe fields |
| Purchases / upsells | Neon `customer_purchases` | Unique on checkout session |
| Onboarding | Neon `customer_onboarding` | Token, answers, `processed_payload` |
| SMS queue / state | Neon `sms_*` | Claim leases, opt-out, inbound |
| Demo views / engagement | **Nowhere** | |
| Churn / cancel state | **Nowhere** (Stripe only) | Neon stays `customer` forever |
| LIVE customer site | **Nowhere** (still demo JSON) | |

---

## 3. Manual steps (operator checklist)

These are required today for a healthy factory:

1. **Run discovery + generation locally** — `npm run replenish-leads` (or `generate-lead` / `generate-leads`) with Places + AI + image keys.
2. **Inspect** new `leads/` and `clients/` JSON (and images).
3. **Git commit + push** — demos are not live until Vercel rebuilds.
4. **Keep SMS gateway running** — `tools/sms-gateway` + HiLink modem + shared `SMS_GATEWAY_SECRET`. Without it, Neon queue piles up.
5. **Monitor backlog** — admin `/admin/leads` or morning replenish-status cron; decide when to replenish.
6. **Optional:** admin Queue SMS / Retry / manual email for edge cases.
7. **Optional:** `npm run update-lead -- <slug> <status>` for sales suppress (SMS does not write lead status).
8. **After purchase:** customer self-serves onboarding (emails automated).
9. **Admin approve** onboarding (`approved_for_publish`) — email only.
10. **Apply customer content to live site** — still fully manual / unimplemented (“Objavi LIVE” placeholder).
11. **Handle churn manually in Stripe** — no in-app portal or webhook sync.

---

## 4. Duplicated functionality & unclear ownership

| Duplication | Detail |
|-------------|--------|
| Lead status vs SMS state | Email outreach updates lead JSON (`contacted` / `followup_*`). SMS updates Neon only — lead often stays `generated` |
| Customer in Neon vs lead JSON | Stripe IDs / upsells mirrored optionally via `upsell-store` / `merge.ts`; DB wins at read time |
| Industry filters vs professions | Matrix uses `DiscoveryProfessionId`; standalone scripts still use legacy `LeadIndustryId` |
| ICP / slot-yield vs matrix | Dead code (`icp.ts`, `slot-yield.ts`) alongside live discovery matrix |
| Email + SMS outreach stacks | Two full pipelines; email cron disabled but admin/CLI still work |
| Demo vs customer site | Same `/{slug}` URL; chrome swaps purchase bar ↔ preparing bar — no separate customer publish artifact |

---

## 5. Architectural weaknesses

1. **Generation cannot run on Vercel** — ephemeral FS; cron deliberately status-only. Factory throughput = operator laptop + git.
2. **Git as demo CDN** — every demo is a commit; build bundles all `site.json` (`get-site-config.ts`). Scales poorly past ~1–5k sites.
3. **`readAllLeads()` O(n)** — discovery dedup and admin scan every lead file (`leads/store.ts`).
4. **SMS SPOF** — physical modem + local poller; no health check / alerting in-app.
5. **No churn sync** — cancelled Stripe subscriptions leave `isCustomer(slug) === true` forever → purchase bar stays hidden, onboarding stays open.
6. **Onboarding dead-end** — `processed_payload` ready for `apply-onboarding` CLI (documented, not built); LIVE button disabled.
7. **Dual outreach status models** — suppress rules rely on lead JSON *or* Neon; easy to over/under-message.
8. **Concurrent replenish unsafe** — progress JSON RMW without lock.

---

## 6. Missing automation

| Gap | Impact |
|-----|--------|
| Auto replenish when `needed > 0` | Operator must notice cron status and run CLI |
| Auto commit / PR / deploy of demos | Generated demos sit local until someone pushes |
| SMS gateway health / alert | Silent queue stall |
| Lead status sync from SMS sent/replied | Admin pipeline views drift from reality |
| Publish onboarding → site | Manual ops after approve |
| Stripe cancel / payment_failed webhooks | Ghost customers |
| Demo engagement signals | Cannot prioritize follow-ups or kill dead demos |
| Unconverted demo TTL / archive | Repo and build grow without bound |
| Customer portal / cancel UX | Out of scope today (`docs/CHECKOUT.md`) |

---

## 7. State that should be persisted (factory-ready)

Prefer **Neon** for mutable pipeline state; keep **git or Blob** for published site snapshots.

| State | Propose |
|-------|---------|
| Lead index (`slug`, `google_place_id`, status, phone, region, profession, demo_ready_at) | Neon table (unique place id) — stop `readAllLeads()` for hot paths |
| Discovery progress | Neon or durable object storage (not laptop-only file) |
| Demo publish record (`slug`, `content_version`, `deployed_at`, `source_commit`) | Neon |
| Outreach channel state | Keep Neon SMS; optionally unify email into same tables or deprecate email automation |
| Engagement (`demo_views`, `last_viewed_at`, SMS click if trackable) | Neon |
| Customer lifecycle (`active` / `past_due` / `canceled`) | Neon `customers.status` + Stripe webhooks |
| Onboarding publish job | Neon status `live` + stored published config version |
| Cleanup decisions (`archived_at`, `reason`) | Neon + soft-hide from static params |

Keep git (or Blob JSON) as the **content artifact** for demos until a CMS is justified — do not invent a new stack yet.

---

## 8. Race conditions

| Risk | Current mitigation | Residual gap |
|------|-------------------|--------------|
| Concurrent replenish CLIs | None | Progress corruption / double discover |
| Double `generateClient` on same slug | `clientExists` check | TOCTOU before write completes |
| Stripe webhook retries | Unique `stripe_checkout_session_id`; `alreadyProcessed` | Good |
| Welcome email double-send | `welcome_email_sent_at` | Good |
| SMS double enqueue | Unique `(slug, step)` for active/sent | Good |
| SMS claim crash | Lease expiry + reclaim | Good |
| Daily SMS budget overshoot | Check-then-insert | Mild overshoot possible under concurrency |
| Opt-out vs enqueue | Re-check before insert | Short race window |
| Upsell page vs webhook lag | `syncUpsellsForBaseSession` recovery | Good |
| Customer chrome DB outage | Falls back to non-customer UI | May briefly show purchase bar to payer |

---

## 9. Cleanup opportunities

| Opportunity | Why |
|-------------|-----|
| Delete or quarantine `icp.ts` / `slot-yield.ts` | Dead; confuses operators |
| Remove unused `nodemailer` dependency | Dead package |
| Retire or clearly label email cold-outreach as manual-only | Docs still partially describe cron |
| Soft-archive demos: unconverted after N days + no SMS reply | Cuts build size and noise |
| Prune `discovered`-only leads with no mobile / has website | Disk clutter |
| Gateway dry-run checklist in admin | Prevent accidental silent stalls |
| Consolidate lead stripe fields → DB-only | Less merge logic |

---

## 10. Scalability (hundreds → thousands)

| Scale | Breaks first |
|-------|--------------|
| ~500 actionable (current target) | Operator replenish loop is the bottleneck, not code |
| ~1–2k demos in git | Build time + webpack site map size; admin list without pagination |
| ~5k leads | `readAllLeads()` on every discovery query becomes slow; git repo heavy |
| ~10k sites | `generateStaticParams` + bundled configs untenable without lazy load |
| SMS volume | Modem + `SMS_DAILY_LIMIT` (100) — hardware ceiling before software |
| Gemini batch gen | ~13 RPM limiter → hours per 100 demos — OK for worker, bad for interactive CLI |

---

## 11. Target “website factory” (reuse-first)

Do **not** introduce Kafka, a new CMS, or a microservices split. Stretch the current stack:

```text
┌──────────────────────────────────────────────────────────┐
│ Vercel (unchanged product surface)                        │
│  demos · checkout · webhooks · SMS API · admin · crons   │
└───────────────┬──────────────────────────┬───────────────┘
                │                          │
         Neon (pipeline + customers)   Blob (images + optional site JSON)
                ▲
                │
┌───────────────┴───────────────┐
│ Generation worker (CI or VM)   │  ← replaces laptop for replenish
│  Places → AI → images →        │
│  write artifact → open PR or    │
│  push branch → Vercel deploy    │
└───────────────────────────────┘
         ▲
         │ still: tools/sms-gateway (or later managed SMS)
```

**Factory definition of done:**  
Operator sets targets and reviews exceptions; the system keeps actionable demos topped up, outreaches, converts, provisions, and eventually reclaims dead inventory — with cancel/churn reflected in product UI.

---

## 12. Highest-value improvements (priority order)

### P0 — Unblock unattended generation (biggest manual sink)

**Goal:** When replenish status says `needed > 0`, demos appear on production without a human CLI session.

1. **Generation worker** (GitHub Action on schedule / webhook from status cron, or a small always-on VM).
   - Reuse `replenishSmsLeads()` as-is.
   - Persist discovery progress to a durable path (commit encrypted artifact, or Neon blob column, or private S3/Blob) so the worker is resumable.
   - Output: commit or PR with `src/content/leads/**` + `src/content/clients/**`.
2. **Auto-merge or auto-push policy** for demo-only paths (protect non-content dirs).
3. **Admin “Replenishment health”** — last worker run, errors, actionable vs target (surface existing `getReplenishStatus`).

*Reuse:* `src/leads/replenish.ts`, existing cron status route as trigger signal.

---

### P1 — Close the customer loop (provisioning + churn)

4. **`apply-onboarding` path** (CLI first, then admin button).
   - Read `processed_payload` from Neon.
   - Write updated `business.json` / `site.json` (or Blob override) using existing validators.
   - Set onboarding status `live`.
   - Wire **Objavi LIVE** to this (replace placeholder in `onboarding-admin.tsx`).
5. **Stripe lifecycle webhooks:**
   - `customer.subscription.updated` / `deleted` / `invoice.payment_failed`.
   - Map to `customers.status`: `active` | `past_due` | `canceled`.
   - `isCustomer` / purchase bar / SMS eligibility must respect status.
6. **Optional:** Stripe Customer Portal link for cancel/update (env-flagged).

*Reuse:* `customers/store.ts`, `onboarding/process.ts`, `pricing-from-onboarding.ts`, webhook route pattern.

---

### P2 — Pipeline truth & outreach reliability

7. **Sync SMS events → lead status** (or deprecate lead status for outreach and drive admin filters from Neon). Prefer one source of truth.
8. **SMS gateway heartbeat** — gateway posts `/api/outreach/sms/health` periodically; cron alerts via Resend if stale.
9. **Unify suppress rules** — customer (active), opt-out, do_not_contact checked in one module used by SMS + email.

*Reuse:* `outreach/sms/store.ts`, `eligibility.ts`, `leads/statuses.ts`.

---

### P3 — Scale storage without rewrite

10. **Neon `leads` index table** — upsert on discover/generate; unique `google_place_id`; admin + dedup query DB first, files remain content store.
11. **Lazy site config load** — replace full `require.context` map with on-demand read (FS or Blob) so build does not O(n) every site forever.
12. **Demo archive policy** — e.g. unconverted + no SMS engagement after 90 days → `archived`, exclude from `siteSlugs` / static params, keep files in git history or move to cold storage.

*Reuse:* existing JSON schema; add thin DB index rather than migrating all content day one.

---

### P4 — Engagement & cleanup intelligence

13. **Lightweight demo view counter** — `POST /api/demo-view` (slug, anonymized IP hash), Neon counters; no third-party analytics required initially.
14. **Prioritize SMS follow-ups** by views / non-views.
15. **Cleanup cron** — soft-archive candidates; report in admin; hard-delete only with confirm.

---

### P5 — Hygiene (do early if cheap)

16. Remove dead ICP/slot-yield from the replenish mental model (delete or `DEPRECATED.md`).
17. Require `RESEND_WEBHOOK_SECRET` in production.
18. File lock or single-flight for local/worker replenish.
19. Drop unused `nodemailer`.

---

## 13. Explicit non-goals (for now)

- Do **not** rewrite Next.js app or split into microservices.
- Do **not** replace Neon, Stripe, Resend, or the appearance/template system.
- Do **not** require a headless CMS before apply-onboarding + worker exist.
- Do **not** force managed SMS until modem capacity is proven insufficient — document gateway as required infra first.
- Do **not** rebuild discovery matrix — it is the correct production path.
- Do **not** automate custom domain attach, registrar purchase, or DNS — documented in §16; manual ops until Phase 2+.

---

## 14. Suggested implementation sequence

| Phase | Deliverable | Operator effect |
|-------|-------------|-----------------|
| **A** | Worker + durable progress + auto PR/push | Replenish becomes “review PR” or fully hands-off |
| **B** | Apply-onboarding + LIVE button | Purchase → form → approve → publish at path URL without hand-editing JSON; custom domain separate (§16) |
| **C** | Stripe cancel/past_due sync | Product UI matches billing reality |
| **D** | Lead index + SMS status sync + gateway heartbeat | Admin trust; fewer silent failures |
| **E** | Lazy configs + archive policy + view counters | Survive 5k+ demos |

Each phase should ship behind existing admin/cron surfaces — no new product brand, no parallel app.

---

## 15. Acceptance criteria (factory MVP)

A factory MVP is reached when:

1. Actionable demo count stays near `SMS_LEAD_TARGET` for 7 days with **zero** laptop replenish sessions (worker only).
2. A test purchase can go **checkout → onboarding → admin approve → LIVE content visible** without editing files by hand.
3. Canceling the Stripe subscription restores non-customer demo chrome within one webhook delivery.
4. Admin can see: actionable backlog, last worker run, SMS gateway freshness, onboarding queue.
5. Unconverted demos older than policy are soft-hidden from the public catalog (even if files remain).

---

## 16. Custom domain architecture

> **Date:** 2026-08-31  
> **Scope:** Read-only audit of how domains work today + recommended production path.  
> **Boundary:** Priority 2 (customer LIVE publish) does **not** include domain attach. Custom hostnames are a follow-on phase after path-based LIVE ships.

### 16.1 Current state

#### Runtime routing

| Layer | Reality |
|-------|---------|
| **Host → slug map** | Hardcoded in `src/lib/custom-domains.ts`: only `zbrendiraj.si` / `www.zbrendiraj.si` → slug `zbrendiraj-si` (marketing site, not per-customer). |
| **Middleware** | `src/middleware.ts` rewrites `/`, legal pages on a mapped host to `/{slug}/*`. No per-customer hostname lookup. |
| **Public URLs** | All demos and customers use path URLs: `https://zbrendiraj.si/{slug}` via `src/site-url.ts` and `src/leads/demo-url.ts`. |
| **Customer custom host** | Unmapped — a request to `customer.tld` does not resolve to that customer's slug. |

```text
Browser → zbrendiraj.si/{slug}     → customer site (demo or future LIVE)
Browser → customer.tld             → no mapping today (404 or unrelated content)
Browser → zbrendiraj.si (root)     → middleware rewrite → /zbrendiraj-si (marketing only)
```

#### Database and content

| Store | Domain data |
|-------|-------------|
| **Neon** | No domain table or columns on `customers`. Intent only in `customer_onboarding.answers` (`desiredDomain`, `hasExistingDomain`) and `processed_payload.siteHints` (`src/onboarding/types.ts`, `src/onboarding/process.ts`). |
| **Git** | No `domain` field in `site.json` / `business.json`. |
| **Stripe / Neon plan** | `customers.subscription_plan` is `"monthly"` \| `"yearly"`. No `domain_included`, registrar order id, or expiry fields. |

#### Vercel

- **No Vercel Domains API** in the repo — no attach, list, or verify calls.
- `vercel.json` defines crons only; custom domains are **manual in Vercel Dashboard** on the single Next.js project.
- Deploy model: git push → Vercel build. Domain attach is platform config, not application code.
- Vercel SDK usage today: **Blob storage** only (`src/images/storage.ts`, onboarding upload).

#### Cloudflare

- **No Cloudflare API**, env vars, or automation in code.
- Cloudflare appears only in legal/privacy copy (`src/privacy/components/zbrendiraj/`) as an infrastructure mention.
- DNS for `zbrendiraj.si` and any future customer domains is **operator-managed outside the app**.

#### Provisioning automation today

- **None.** `docs/CHECKOUT.md` lists automatic domain provisioning as out of scope.
- Onboarding collects domain wishes; `src/billing/notify-onboarding-approval.ts` includes `desiredDomain` in the ops approval email. No downstream automation.

### 16.2 Annual “included domain” vs customer-owned

#### Marketing vs data

The yearly plan advertises a free domain in copy only:

- `src/billing/owner-first-name.ts` — purchase bar: yearly → “+ GRATIS DOMENA”
- `src/app/[slug]/hvala/page.tsx`, `src/appearances/zbrendiraj/faq.ts`, pricing section

There is **no entitlement flag** in Neon or Stripe metadata beyond `subscription_plan === 'yearly'`. Onboarding requires `desiredDomain` for **all** plans on submit — not gated on yearly.

#### Customer-owned vs newly provisioned (today)

| Aspect | Customer-owned (`hasExistingDomain: true`) | Included / new (yearly, `hasExistingDomain: false`) |
|--------|---------------------------------------------|-----------------------------------------------------|
| **Collected data** | `desiredDomain` + checkbox | Same fields |
| **Code paths** | Identical — no branching | Identical |
| **Ops today** | Manual: customer/registrar DNS → Vercel; manual Vercel domain add | Manual: register domain (registrar TBD), DNS, Vercel add |

#### Recommended future distinction

| Type | Suggested `source` | Suggested workflow |
|------|-------------------|-------------------|
| Customer-owned | `customer_owned` | Status `pending_customer_dns`; email DNS instructions; verify via Vercel API |
| Yearly included | `included_provisioned` | Gate on `subscription_plan === 'yearly'`; registrar + DNS automation when ready |

### 16.3 What can be automated vs manual

| Step | Automatable? | Notes |
|------|--------------|-------|
| Record domain intent | **Yes** (already) | Onboarding → Neon |
| Know yearly entitlement | **Yes** | `customers.subscription_plan === 'yearly'` |
| Add domain to Vercel project | **Yes** | Vercel Domains API |
| Create DNS records | **Partial** | Cloudflare API if CF is authoritative; else customer/registrar manual |
| Register new `.si` domain | **Partial** | Registrar API or manual; `.si` may stay manual |
| Verify SSL / propagation | **Yes** | Poll Vercel domain status |
| Map host → slug at runtime | **Yes** | DB + middleware after verify |
| Customer-owned at foreign registrar | **Mostly manual** | Email DNS instructions; optional verify-only automation |

**Manual admin gates (even with automation):** annual entitlement before paid registration; customer-owned domains when DNS is not on Cloudflare; apex vs www; transfers; disputes.

### 16.4 Recommended phased architecture

**Phase 1 — ship with Priority 2 (no domain work):**

- LIVE sites stay at **`https://zbrendiraj.si/{slug}`** (same as demos today).
- Domain requests remain in onboarding + admin email; ops handles DNS/Vercel manually.
- Do **not** block LIVE publish on custom domain readiness.

**Phase 2 — minimal domain tracking (still mostly manual):**

- Add Neon table e.g. `customer_domains` (`slug`, `hostname`, `source`, `status`, `vercel_domain_id`, `dns_records_json`, timestamps).
- Extend `src/lib/custom-domains.ts` to load verified host→slug mappings (DB lookup or generated config committed on verify).
- Admin UI: domain status per customer.

**Phase 3 — selective automation (later):**

- Vercel project domain add + verification records; Cloudflare DNS records when CF is authoritative; status polling; customer instruction emails.
- Registrar purchase depends on chosen registrar API (not in stack today).
- Entitlement check before included-domain registration.

```text
Priority 2 LIVE publish  →  zbrendiraj.si/{slug}  (path URL, no domain work)
Onboarding desiredDomain  →  ops manual Vercel + DNS
Phase 2                   →  Neon customer_domains tracking
Phase 3                   →  Vercel + Cloudflare APIs (yearly entitlement gate)
```

---

## 17. Lifecycle gap summary

| Stage | Today | Factory target |
|-------|-------|----------------|
| Lead create | Local CLI | Worker + matrix (same code) |
| Generate | Local CLI | Worker |
| Publish | Manual git | Auto commit/PR → deploy |
| Track views | None | Neon counters |
| Outreach | Cron enqueue + local modem | Same + heartbeat; optional managed SMS later |
| Checkout | Done | Keep |
| Purchase | Done | Keep |
| Provision | Form only | Apply → LIVE |
| Upsells | Done | Keep |
| Cancel | Missing | Webhook → status |
| Cleanup | Missing | Archive policy + cron |

---

## Architecture at a glance

This product is already a **website factory with a human in the middle**: discovery/generation and SMS radio are local; Vercel handles serving, money, and queues. The highest leverage is to **automate the human middle** (worker + git publish + onboarding apply + churn webhooks) while keeping Neon/Stripe/templates/matrix intact. Tracking and cleanup come after the loop can run unattended.
