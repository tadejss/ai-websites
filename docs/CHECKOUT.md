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

# Recommended: 22 % DDV (exclusive). Create in Stripe → Settings → Tax rates.
STRIPE_TAX_RATE_ID=txr_...

# Homepage pricing table (Zbrendiraj.si)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_...
```

Also required for purchase emails: `RESEND_API_KEY`.

`SITE_URL` should be `https://zbrendiraj.si` (optional `/demo` suffix). Use a normal **Config** env var on Vercel — not `NEXT_PUBLIC_…` (that prefix is only for values that must ship to the browser). Legacy `NEXT_PUBLIC_SITE_URL` still works as a fallback. The retired `splet.vercel.app` host is ignored in code and redirected to `zbrendiraj.si`.

## Stripe Dashboard

1. Product **Zbrendiraj spletna stran** with recurring prices 29 EUR/mo and 290 EUR/yr (exclusive of tax).
2. Create a **22 % exclusive** tax rate (DDV, jurisdiction SI) and set `STRIPE_TAX_RATE_ID`. Without it, checkout tries Stripe Tax (`automatic_tax`), which requires Tax registration for Slovenia in the Dashboard.
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
