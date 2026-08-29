# Customer onboarding

Post-purchase questionnaire for Zbrendiraj.si customers. Mutable state lives in **Neon Postgres** (`customer_onboarding`); demo git JSON remains read-only input for prefill and processing.

## Flow

1. Stripe base subscription webhook → `customers` + `customer_onboarding` (token)
2. Customer email + ops email with magic link
3. Demo page shows **CustomerPreparingBar** instead of purchase bar
4. Customer completes `/{slug}/vsebina?token=...` (3 steps)
5. Submit → `submitted` → `processing` → merge with demo `business.json` (read-only) → `processed_payload` in Neon → `ready_for_approval`
6. Ops email: **Nova spletna stran čaka na potrditev**
7. Admin reviews `/admin/leads/[slug]` — **Objavi LIVE** is a future step (placeholder only)

## Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Token created, questionnaire not started |
| `in_progress` | Draft saved |
| `submitted` | Customer submitted answers |
| `processing` | Server merging/processing |
| `ready_for_approval` | Processed payload ready for ops review |
| `live` | Published (future — manual admin action) |

## API

- `GET /api/onboarding/[slug]?token=...` — prefill + status
- `PATCH /api/onboarding/[slug]` — save draft (`in_progress`)
- `POST /api/onboarding/[slug]` — validate + submit + process
- `POST /api/onboarding/[slug]/upload` — logo/photo → Vercel Blob (`onboarding/{slug}/...`)

All endpoints require valid token + `isCustomer(slug)`.

## Factory next step

`processed_payload.businessInput` is a merged `BusinessInput`-shaped object ready for a future CLI:

```bash
# Planned — not implemented in app runtime
npm run apply-onboarding -- <slug>
```

Production runtime **does not** write `src/content/clients/` files.

## Env

Same as checkout: `DATABASE_URL`, `RESEND_API_KEY`, `SITE_URL`, `BLOB_READ_WRITE_TOKEN` (optional uploads).

Schema applied via `ensureCustomerSchema()` on first use.
