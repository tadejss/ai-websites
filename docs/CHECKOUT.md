# Stripe checkout on demos

Subscription checkout for demo sites (monthly / yearly) via [Stripe Checkout](https://stripe.com/payments/checkout).

## Product

| Plan | Netto | Notes |
|------|-------|--------|
| Monthly | 29,00 EUR + 22 % DDV | Recurring |
| Yearly | 290,00 EUR + 22 % DDV | 10× monthly; domain included (ops / copy) |

Create both prices in Stripe as **tax exclusive**. Prefer **Stripe Tax** (Slovenia 22 %). Alternatively set a fixed tax rate ID.

## Environment variables

Add to `.env.local` and Vercel:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
CHECKOUT_NOTIFY_EMAIL=info@zbrendiraj.si

# Optional: use a fixed Stripe Tax Rate instead of automatic_tax
# STRIPE_TAX_RATE_ID=txr_...
```

Also required for purchase emails: `RESEND_API_KEY`.

`NEXT_PUBLIC_SITE_URL` should be the public demo base (e.g. `https://zbrendiraj.si/demo`) so success/cancel URLs resolve correctly.

## Stripe Dashboard

1. Product **Zbrendiraj spletna stran** with recurring prices 29 EUR/mo and 290 EUR/yr (exclusive of tax).
2. Enable Stripe Tax for SI, **or** create a 22 % tax rate and set `STRIPE_TAX_RATE_ID`.
3. Webhook endpoint: `https://zbrendiraj.si/api/webhooks/stripe`
   - Event: `checkout.session.completed`
4. Local test: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Flow

1. Demo pages (all appearances except `zbrendiraj`) show a purchase bar when the lead is not already `customer`.
2. `POST /api/checkout` with `{ slug, plan: "monthly" | "yearly" }` creates a Checkout Session and returns `{ url }`.
3. After payment, Stripe hits the webhook → lead `status: customer` + Stripe IDs → email to `CHECKOUT_NOTIFY_EMAIL`.
4. Buyer lands on `/{slug}/hvala` (also via `/demo/{slug}/hvala`).

## Notes

- Lead updates use the same file store as outreach webhooks; the Resend notification is the reliable ops signal on Vercel.
- Customer portal / cancel UI and automatic domain provisioning are out of scope for this pass.
