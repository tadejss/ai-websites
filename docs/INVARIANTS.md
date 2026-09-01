# Invariants

> **Verified against code:** 2026-09-01  
> **Source of truth:** the functions cited under each rule.  
> **Stale / unverified:** none for the rules; production env flags that *gate* some rules are UNKNOWN (see Open questions).

Each rule: **why** → **where enforced** → **what breaks**.

---

## 1. Git is the source of truth for served site JSON

Neon must not silently overwrite `site.json`. Customer edits live in `customer_onboarding.processed_payload` until `publishCustomerSite` → `applyCustomerSite`.

- **Why:** Vercel serves bundled git files (`getSiteConfig` `require.context`). A Neon-only write is invisible on production.
- **Where:** `src/onboarding/process.ts` writes JSONB only; `src/onboarding/apply-customer-site.ts` is the git writer; `publish-customer.ts` commits.
- **Break:** Admin thinks the site is LIVE (`processed_payload` ready) but `/{slug}` still shows the demo. Or a hypothetical DB write diverges from git forever.

---

## 2. Do not change `site-config.schema.json` without the trio

Schema + Zod validator + generator (+ at least one real `site.json`).

- **Why:** `additionalProperties: false`. Extra keys fail validation; missing required keys fail build/load.
- **Where:** `validateSiteConfig` on bundle and on write (`generate-client.ts`, `apply-customer-site.ts`). AI parse: `parseAndValidateSiteConfig` in `src/ai/providers/prompt.ts`.
- **Break:** `next build` dies while validating hundreds of clients, or generation retries forever.

---

## 3. Appearances exist only if registered

Folder + `APPEARANCE_IDS` + registry + Zod/schema enum.

- **Why:** `SitePage` does `appearanceRegistry[resolveAppearance(...)]`. Unknown IDs fall back to `default` (`resolve-appearance.ts`) — a new folder alone never renders.
- **Where:** `src/appearances/types.ts`, `registry.ts`, `validate-site-config.ts`, `site-config.schema.json`.
- **Break:** Silent default chrome on every new industry site; or Zod reject at generation.

`zbrendiraj` must stay manual — `appearanceForIndustry` never returns it.

---

## 4. SMS only through queue + eligibility + opt-out

- **Why:** STOP/GDPR; duplicate GSM cost; modem throughput.
- **Where:** `evaluateSmsEligibility` (`eligibility.ts`); enqueue `enqueueSmsForLead` (`queue.ts`); opt-out `opt-out.ts` / `inbound.ts` sets `smsAllowed: false`. Unique index `sms_messages_active_slug_step_uidx`. Gateway is the only sender.
- **Break:** Texts after STOP; double-send same step; Vercel trying to hit HiLink (impossible / wrong architecture).

Do not use email `src/outreach/send.ts` as the automated channel. Cron email is skipped.

---

## 5. Stripe webhook is idempotent on Checkout Session id

- **Why:** Stripe retries 5xx. Duplicate rows would double-count upsells / confuse onboarding.
- **Where:** `customer_purchases_session_uidx` in `src/db/schema.ts`; `upsertCustomerFromCheckout` / `recordCustomerUpsellPurchase` in `src/customers/store.ts`. Handler only `checkout.session.completed`.
- **Break:** Duplicate purchases; unique-index 500 loops; or missed events if you 200 without writing.

Do not add a second write path that skips the unique index.

---

## 6. Do not commit `data/`, secrets, or generated binaries listed in `.gitignore`

- **Why:** Progress/cache is machine-local or Neon; secrets leak; repo size.
- **Where:** `.gitignore` — `.env*`, `data/lead-discovery-progress.json`, `data/image-asset-cache.json`, Unsplash times, `logs/`, `public/clients/**/*.avif|webp`, `tools/sms-gateway/.env`.
- **Break:** Stolen keys; two workers fighting over committed progress JSON; Blob URLs mixed with accidental local files.

Discovery progress **SoT with DB** is Neon (`factory_discovery_progress`), not the gitignored file.

---

## 7. Respect generator rate limits

| Limit | Why | Where | Break |
|-------|-----|-------|-------|
| Gemini ≥ 4100ms between calls, 3× 429 retry | Free-tier ~15 RPM | `src/ai/gemini-request.ts` `acquireGeminiSlot` | 429 storm; replenish abort |
| Places 2s between pagination pages; 80 searches/run | API cost + quota | `google-places-source.ts`, `discovery-config.ts` | Billing spike; run halt |
| Unsplash 45 searches/hour file log | API ToS | `unsplash-rate-limit.ts` | 403/429; skip to Pexels if wait > 15s |
| SMS `SMS_DAILY_LIMIT` (default 100), `SMS_MIN_DELAY_MS` (3000) | Modem + law | `sms/config.ts`, gateway | Operator lockout / spam |

OpenAI has **no** in-repo limiter — batch with `AI_PROVIDER=openai` can still 429. UNKNOWN recovery beyond throw.

---

## 8. One factory worker at a time; one generate per slug

- **Why:** Duplicate Places/AI spend; git push races.
- **Where:** `claimWorkerLease` (`src/factory/lease.ts`); `tryAcquireGenerationLock` (`generation-lock.ts`); GHA `concurrency.group: factory-worker`.
- **Break:** Overlapping commits; locks stuck `generated` if push fails after local write (see cost audit).

Do not run `replenish-leads` (no lease unless you injected Neon store) in parallel with GHA on the same tree without understanding progress split (file vs Neon).

---

## 9. `saveLead` must not clobber sales-owned fields

- **Why:** Generation/discovery re-writes would wipe notes, outreach, or a salesperson's `do_not_contact`.
- **Where:** `SALES_OWNED_FIELDS` merge in `src/leads/store.ts`. Exception: `status === "discovered"` may advance to `generated`.
- **Break:** Re-generated demo resets pipeline; SMS/email suppression lost.

Stripe still does **not** rely on these JSON fields — Neon wins at read (`getLeadWithCustomerState`).

---

## 10. Onboarding locks after approve

- **Why:** Customer must not mutate payload while GHA applies it.
- **Where:** `isOnboardingLockedForCustomerEdits` — `approved_for_publish`, `publishing`, `publish_failed`, `live`.
- **Break:** Race: new answers vs `applyCustomerSite` snapshot; or edits after LIVE with no republish.

`access_token` is created once (`ensureOnboardingAccess`) — do not rotate in a casual refactor without migrating URLs already emailed.

---

## 11. `FACTORY_PUBLISH_ENABLED=false` means files stay local

- **Why:** Safety switch so a laptop run cannot push.
- **Where:** `gitPublishPaths` returns noop (`src/factory/git-publish.ts`).
- **Break:** Operator thinks production updated; demos never appear. Worker run `failed` if publish expected.

---

## 12. Do not generate on Vercel Route Handlers

- **Why:** Ephemeral filesystem; cannot persist JSON or git.
- **Where:** Comment + behavior of `src/app/api/cron/replenish-leads/route.ts` (status/dispatch only).
- **Break:** “Successful” cron that wrote nothing durable; wasted AI if someone adds generate() to a serverless function.

---

## 13. Demo views are best-effort and must not gate rendering

- **Why:** Pages must render if Neon is down.
- **Where:** `after(() => void recordDemoView(...))` on `[slug]/page.tsx`; store no-ops without DB. Excludes `zbrendiraj-si`, `default`, `test`, and customers.
- **Break:** If you `await` tracking in the page body, a DB blip 500s every demo.

`isNeverViewedDemo` is **not** permission to delete git files — cleanup is Missing.

---

## Open questions

- Whether production has dispatch enabled — if not, invariants 1 and 11 still hold but approve will not push.
- OpenAI rate-limit behavior under batch: no code path to cite.
