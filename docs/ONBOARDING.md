# Customer onboarding

> **Verified against code:** 2026-09-01 — still aligned. Factory context: [AGENT-CONTEXT.md](./AGENT-CONTEXT.md), [FACTORY.md](./FACTORY.md) stage 6.

Post-purchase questionnaire for Zbrendiraj.si customers. Mutable state lives in **Neon Postgres** (`customer_onboarding`); demo git JSON remains read-only input for prefill and processing until `publishCustomerSite` / `applyCustomerSite`.

## Flow

1. Stripe base subscription webhook → `customers` + `customer_onboarding` (token)
2. Customer email + ops email with magic link
3. Demo page shows **CustomerPreparingBar** instead of purchase bar
4. Customer completes `/{slug}/vsebina?token=...` (3 steps)
5. Submit → `submitted` → `processing` → merge with demo `business.json` (read-only) → `processed_payload` in Neon → `ready_for_approval`
6. Ops email: **Nova spletna stran čaka na potrditev**
7. Admin reviews `/admin/leads/[slug]` — **Potrdi in pripravi za objavo**
8. Auto-dispatch → GitHub Action `customer-publish` → apply payload → git push → Vercel
9. Status `live` at `https://zbrendiraj.si/{slug}`

## Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Token created, questionnaire not started |
| `in_progress` | Draft saved |
| `submitted` | Customer submitted answers |
| `processing` | Server merging/processing |
| `ready_for_approval` | Processed payload ready for ops review (customer may still edit) |
| `approved_for_publish` | Admin approved; publish dispatch queued |
| `publishing` | GitHub Action applying content and pushing |
| `publish_failed` | Push/apply failed — admin **Ponovi objavo LIVE** |
| `live` | Customer content published at `/{slug}` |

## API

- `GET /api/onboarding/[slug]?token=...` — prefill + status
- `PATCH /api/onboarding/[slug]` — save draft (`in_progress`)
- `POST /api/onboarding/[slug]` — validate + submit + process
- `POST /api/onboarding/[slug]/upload` — logo/photo → Vercel Blob (`onboarding/{slug}/...`)

All endpoints require valid token + `isCustomer(slug)`.

## Factory apply + publish

`processed_payload` is merged into `src/content/clients/{slug}/` (demo snapshot in `demo/`). Publish runs via:

```bash
npm run publish-customer -- <slug>
```

Triggered automatically on admin approve (`repository_dispatch: customer-publish`). Requires `FACTORY_DISPATCH_ENABLED`, `FACTORY_GITHUB_REPO`, `FACTORY_GITHUB_TOKEN`, and `DATABASE_URL` on GitHub Actions.

## Env

Same as checkout: `DATABASE_URL`, `RESEND_API_KEY`, `SITE_URL`, `BLOB_READ_WRITE_TOKEN` (optional uploads).

Schema applied via `ensureCustomerSchema()` on first use.
