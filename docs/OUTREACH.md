# Email outreach

> **LEGACY (2026-09-01):** Automated outreach is **SMS-only**. `/api/cron/outreach` returns `{ skipped: true }` (`src/app/api/cron/outreach/route.ts`). This file documents the **manual/admin/CLI email** path (`src/outreach/send.ts`, `npm run send-outreach`). Do not “fix” or re-enable the email cron as the factory default. Active channel: [SMS_OUTREACH.md](./SMS_OUTREACH.md).

Automated outreach for leads with generated demo sites, powered by [Resend](https://resend.com).

## Environment variables

Add these to `.env.local` (local) and your deployment environment:

```bash
# Resend
RESEND_API_KEY=
OUTREACH_FROM_EMAIL=
OUTREACH_FROM_NAME=

# Safety switch – keep true until sender domain is verified
OUTREACH_DRY_RUN=true

# Cron + admin protection
CRON_SECRET=
ADMIN_SECRET=

# Optional
RESEND_WEBHOOK_SECRET=
OUTREACH_BATCH_SIZE=10
OUTREACH_FOLLOWUP_1_DAYS=3
OUTREACH_FOLLOWUP_2_DAYS=7
```

`OUTREACH_FROM_EMAIL` and `RESEND_API_KEY` are required for live sends. With `OUTREACH_DRY_RUN=true`, the system logs what would be sent without contacting leads or updating outreach timestamps.

For demo subscription checkout (Stripe), see [CHECKOUT.md](./CHECKOUT.md).

## Lead requirements

A lead is eligible only when:

- A generated site exists at `src/content/clients/{slug}/site.json`
- Status is not `replied`, `interested`, `not_interested`, `rejected`, `customer`, or `do_not_contact`
- A valid email exists on the lead (`email`) or in `business.json`

Emails are never invented.

## Outreach sequence

| Step | When | Lead status after send |
|------|------|------------------------|
| Initial | Day 0 (`generated`) | `contacted` |
| Follow-up #1 | 3 days after initial | `followup_1` |
| Follow-up #2 | 7 days after follow-up #1 | `followup_2` |

The cron endpoint processes due leads in batches (`OUTREACH_BATCH_SIZE`, default 10). Scheduling is idempotent: duplicate sends are prevented via per-step timestamps.

## Testing with dry run

```bash
OUTREACH_DRY_RUN=true npm run outreach-summary
OUTREACH_DRY_RUN=true npm run send-outreach -- milimeter-frizerski-salon
```

Dry run logs appear in `logs/outreach.jsonl` and stdout. Lead files are not updated.

## Manual send

Admin UI (after setting `ADMIN_SECRET`):

1. `npm run dev`
2. Open `/admin/login`
3. Open a lead detail page and click **Send**

CLI:

```bash
npm run send-outreach -- <slug> [--step initial|followup_1|followup_2] [--force]
```

API:

```bash
curl -X POST http://localhost:3000/api/admin/outreach/send \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"slug":"milimeter-frizerski-salon"}'
```

## Automated cron

Vercel Cron calls `/api/cron/outreach` daily at 09:00 UTC (see `vercel.json`).

Manual trigger:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/outreach
```

## Resend webhooks

Configure Resend to POST to `/api/webhooks/resend` for `email.delivered`, `email.bounced`, and `email.complained`.

Set `RESEND_WEBHOOK_SECRET` to the signing secret from Resend. Webhook handling is idempotent and updates `outreach.deliveryStatus` on the matching lead.

## Production checklist

1. Verify sender domain in Resend
2. Set `OUTREACH_FROM_EMAIL` / `OUTREACH_FROM_NAME`
3. Set `RESEND_API_KEY`, `CRON_SECRET`, `ADMIN_SECRET`
4. Configure Resend webhook + `RESEND_WEBHOOK_SECRET`
5. Set `OUTREACH_DRY_RUN=false`
6. Add real lead emails (lead `email` field or `business.json`)
7. Send one manual test, then enable cron
