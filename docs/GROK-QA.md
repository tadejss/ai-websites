# Grok QA

> **Verified against code:** 2026-09-03  
> **Source of truth:** `src/qa/`, `src/db/schema.ts` (`QA_SCHEMA_SQL`), `src/app/api/cron/grok-qa/route.ts`, `src/app/api/admin/qa/`.  
> **Do not confuse with:** catalog look previews at `qa-{lookId}` (`scripts/create-look-demos.ts`). Those are unrelated.

---

## 1. Purpose

Grok QA is an **additional, read-only** review layer for already-generated demo websites.

It evaluates compact site + business JSON and returns structured findings. The existing factory worker still owns discovery, generation, git publish, and SMS. QA **does not**:

- generate or edit `site.json`
- publish / unpublish
- change lead status
- send SMS
- run shell, git, Stripe, Cloudflare, or arbitrary SQL

v1 is **observational**: FAIL is stored and shown in admin. It does not block git publish or SMS.

---

## 2. Architecture

```text
generateClient writes site.json + business.json
        ↓
enqueue pending qa_runs (Neon)
        ↓
factory worker (capped) and/or Vercel cron `/api/cron/grok-qa`
        ↓
deterministic checks + Grok structured output
        ↓
policy in code → immutable qa_runs row
        ↓
admin entity card
```

Module: `src/qa/` (isolated, like `src/email/`). Not an `src/ai` generation provider.

The Vercel cron is allowed because QA does not write git. Generation stays on GHA/CLI.

---

## 3. QA input

Built by `src/qa/build-input.ts` from real types (`LeadRecord`, `BusinessInput`, `SiteConfig`):

- lead slice (slug, name, industry, phone, address, city, status)
- business.json without reviews
- extracted visible copy (not image binaries)
- `deterministicChecks`
- deployment path `/{slug}` and whether `demo_lifecycle.published_at` is known

The repo, source files, and live screenshots are **not** sent.

---

## 4. QA categories

| Kind | Who | What |
|------|-----|------|
| **Deterministic** | Code (`src/qa/deterministic.ts`) | Zod schema, quality bounds, unsupported claims, phone/name/city/address identity, nav anchors, image keys |
| **AI** | Grok | Slovenian language, generic/template tone, business-fit, non-exact contradictions, UX copy (hero/CTA/hierarchy) from text only |

Visual defects are `verificationStatus = "not_verified"`. There is no Playwright/screenshot pipeline.

Unknown research fields are **not** errors (`identityDiffs.kind = "unknown"`).

---

## 5. Structured output

Grok must return JSON matching `src/qa/schemas.ts` (`summary` + `issues[]` with closed enums).

The model schema **omits** `status`, `score`, and `publish`. Those are computed in `src/qa/policy.ts`.

Every issue has evidence / expected / actual / confidence / recommendedFix (string only — never executed).

---

## 6. QA policy

Grok reports findings. The app decides pass/fail:

- any **critical** or **high** → `fail`
- **medium** → `warning`, or `fail` if `GROK_QA_FAIL_ON_MEDIUM=true`
- **low** only → `warning`
- no issues → `pass`

Score = `100` minus weighted penalties (critical 40, high 20, medium 8, low 2), clamped 0–100.

---

## 7. Persistence

Neon tables `qa_runs` and `qa_run_lease` (`QA_SCHEMA_SQL` in `src/db/schema.ts`, applied by `ensureCustomerSchema`).

Runs are historical. `result_json` is never overwritten after `completed`. Retries insert a **new** row (admin force) or reuse pending with `attempt` (transport failures).

---

## 8. Retry handling

Retryable: timeout, 5xx, 429, network, invalid JSON, schema validation.

Not retryable: missing `XAI_API_KEY`, 401/403, `GROK_QA_ENABLED=false`.

Bounded by `GROK_QA_MAX_ATTEMPTS` (default 2). Per-slug lease prevents duplicate workers.

Automatic enqueue skips if a **completed** run already exists for the same `slug` + content hash. Admin **Run QA** always inserts a new row.

---

## 9. Security

- Model output is untrusted: Zod parse, closed enums, length caps, issue cap.
- Forbidden `publish` field is rejected.
- No tools (no web search, code execution, MCP).
- xAI `store: false` so prompts are not kept for 30 days.
- Never interpolate model text into SQL or shell.

---

## 10. Cost tracking

Each completed run stores `model`, `input_tokens`, `output_tokens`, `estimated_cost_usd`.

Payload is compact. Default model `grok-4.6` with `reasoning.effort = low`. Factory drain is capped by `GROK_QA_MAX_PER_WORKER_RUN` (default 20).

---

## 11. Admin UI

On `/admin/e/[slug]` (generated and later): Grok QA card with status, score, last run, run count, open issues, highest severity, issue details, and **Run QA**.

Factory ops shows pending/failed QA counts.

`POST /api/admin/qa/[slug]/retry` requires admin auth.

---

## 12. Current limitations

- No visual / screenshot QA
- No live-URL crawl (demos are JSON in git; Vercel deploy is later)
- Observational only — does not gate SMS or publish
- Customer LIVE sites after onboarding are out of scope
- Catalog slugs `qa-*` are look previews, not Grok QA

---

## 13. How to disable

- Unset `XAI_API_KEY` — pending runs are marked `skipped`
- Or set `GROK_QA_ENABLED=false` — no new enqueue; worker/cron no-op

Do not commit secrets. Document names only.

### Env names

| Variable | Default |
|----------|---------|
| `XAI_API_KEY` | unset (skip) |
| `GROK_MODEL` | `grok-4.6` |
| `GROK_QA_ENABLED` | `true` |
| `GROK_QA_MAX_ATTEMPTS` | `2` |
| `GROK_QA_MAX_PER_WORKER_RUN` | `20` |
| `GROK_QA_FAIL_ON_MEDIUM` | `false` |
| `GROK_QA_MAX_ISSUES` | `25` |

GHA `factory-worker.yml` passes `XAI_API_KEY` as an optional secret.
