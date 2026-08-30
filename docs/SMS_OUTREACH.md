# SMS-only outreach

Automated lead outreach for Zbrendiraj.si is **SMS-only**. Cold email is no longer part of the automated cron flow. Resend remains for onboarding, customer, and ops emails.

## Architecture

```text
Lead JSON (identity)  →  Neon SMS queue  →  local gateway  →  Huawei E3372h HiLink  →  lead phone
```

- Lead identity: `src/content/leads/{slug}.json` (`phone`, `companyName`, `status`, demo slug)
- Mutable SMS state: Neon tables `sms_messages`, `sms_lead_state`, `sms_inbound`
- Modem: physical USB stick on a local machine — **never** accessed from Vercel

## Neon tables

| Table | Role |
|-------|------|
| `sms_messages` | Outbound queue + history (`queued → claimed → sending → sent/failed`) |
| `sms_lead_state` | Per-slug summary (`pending/queued/sending/sent/failed/replied/opted_out`) |
| `sms_inbound` | Received SMS, opt-out flags, optional lead match |

Schema is applied via `ensureCustomerSchema()` (customer + SMS DDL).

## Production env

```bash
SMS_GATEWAY_SECRET=...
SMS_DAILY_LIMIT=100
SMS_MIN_DELAY_MS=3000
SMS_BATCH_SIZE=5
SMS_CLAIM_LEASE_MINUTES=10
SMS_LEAD_TARGET=500
SMS_LEAD_REPLENISH_BATCH=100
DATABASE_URL=...
```

## Lead replenishment (manual)

Demos live in git (`src/content/leads`, `src/content/clients`) and are bundled at build time, so **generation cannot run on Vercel**.

| Job | Role |
|-----|------|
| `GET /api/cron/replenish-leads` (`0 6 * * *`) | Status only: actionable vs `SMS_LEAD_TARGET` |
| `npm run replenish-leads` | **Manual** local discover + demo generation |

Workflow:

1. Check admin **Actionable / Target / Replenishment needed**, or hit the status cron.
2. Locally: `npm run replenish-leads`
3. Inspect new leads/clients.
4. Manually commit, push, and redeploy when satisfied.

Each CLI run recounts actionable leads first, then generates at most `min(gap, SMS_LEAD_REPLENISH_BATCH)`. It never auto-commits.

## API

Gateway-authenticated (`Authorization: Bearer SMS_GATEWAY_SECRET`):

| Method | Path | Role |
|--------|------|------|
| GET | `/api/outreach/sms/queue?limit=` | Atomic claim |
| POST | `/api/outreach/sms/result` | Idempotent send result |
| POST | `/api/outreach/sms/inbound` | Store inbound + opt-out |

Admin (`ADMIN_SECRET` cookie/bearer):

| Method | Path | Role |
|--------|------|------|
| POST | `/api/admin/outreach/sms/queue` | Queue one lead |
| POST | `/api/admin/outreach/sms/retry` | Re-queue failed |

Cron (`CRON_SECRET`):

| Path | Role |
|------|------|
| `/api/cron/sms-outreach` | Enqueue eligible leads (does **not** send SMS) |
| `/api/cron/outreach` | Disabled stub (email automation off) |

## Eligibility

Automated SMS only when:

- valid Slovenian phone (normalized to `+386…`)
- demo `site.json` exists
- not a Neon customer / not suppressed status
- `sms_allowed !== false` / not opted out
- step not already queued/sent
- under daily sent limit

## Opt-out

Inbound bodies matching `STOP`, `ODJAVA`, `NE` (normalized) set `sms_status=opted_out` and `sms_allowed=false`.

## Local gateway

See [tools/sms-gateway/README.md](../tools/sms-gateway/README.md).

## Dry-run end-to-end

1. Set `SMS_DRY_RUN=true` on the gateway machine.
2. Queue SMS from `/admin/leads/[slug]` or run cron enqueue.
3. Run `npm run poll` in `tools/sms-gateway`.
4. Confirm Neon `sms_messages.status=sent` with `provider_message_id` like `dryrun-…`.

## Compliance

Public business phone ≠ unlimited promotional consent. Operators can set `sms_allowed=false` (via opt-out or future admin exclude). Keep volumes within `SMS_DAILY_LIMIT`.

Daily budget counts **in-flight** (`queued`/`claimed`/`sending`) plus **sent today**, so cron cannot queue far ahead of the limit. The local gateway also tracks successful sends per UTC day and will not intentionally exceed `SMS_DAILY_LIMIT`.

Opt-out: exact body `NE` / `STOP` / `ODJAVA` (and a few synonyms). `STOP`/`ODJAVA` also match as a token inside a longer reply. Plain `ne` inside a sentence does **not** opt out.

## Pre-deploy checklist

1. Set `SMS_GATEWAY_SECRET` on Vercel (strong random; shared with gateway).
2. Deploy so `ensureCustomerSchema()` creates SMS tables on first DB touch.
3. Confirm `/api/cron/outreach` stays disabled; cron path is `/api/cron/sms-outreach`.
4. Run gateway with `SMS_DRY_RUN=true` against production queue before live SIM send.
5. Queue one known test number from admin, verify Neon `sms_messages` + lead state.
6. Only then set `SMS_DRY_RUN=false`.
