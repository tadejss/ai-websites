# Stripe checkout on demos

Subscription checkout for demo sites (monthly / yearly) via [Stripe Checkout](https://stripe.com/payments/checkout).

## Product

| Plan | Price (z DDV) | Notes |
|------|---------------|--------|
| Monthly | **35,00 EUR** | Recurring, tax-inclusive |
| Yearly | **350,00 EUR** | Recurring, tax-inclusive; + GRATIS DOMENA (ops / copy) |

Create both prices in Stripe as **tax inclusive** (`tax_behavior: inclusive`). Prefer **Stripe Tax** (Slovenia 22 %) or an **inclusive** tax rate.

> If you keep an **exclusive** `STRIPE_TAX_RATE_ID` while prices are inclusive, Stripe can double-charge DDV. Align tax rate / Stripe Tax with inclusive prices when switching sandbox → live.

Demo purchase bar shows clean amounts (`35 €/mes`, `350 €/leto`) without “z DDV”; marketing/footer copy may still mention DDV.

## Environment variables

Add to `.env.local` and Vercel:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
CHECKOUT_NOTIFY_EMAIL=info@zbrendiraj.si

# Tax: use Stripe Tax or an inclusive SI 22 % rate that matches inclusive prices.
STRIPE_TAX_RATE_ID=txr_...

# Homepage pricing table (Zbrendiraj.si)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_...

# Optional add-ons (Checkout Upsells) — set when Prices exist
# STRIPE_PRICE_ADDON_EMAIL=price_...
# STRIPE_PRICE_ADDON_GBP=price_...
# STRIPE_PRICE_ADDON_REVIEW_BOARD=price_...
```

Also required for purchase emails: `RESEND_API_KEY`.

`SITE_URL` should be `https://zbrendiraj.si` (optional `/demo` suffix). Use a normal **Config** env var on Vercel — not `NEXT_PUBLIC_…` (that prefix is only for values that must ship to the browser). Legacy `NEXT_PUBLIC_SITE_URL` still works as a fallback. The retired `splet.vercel.app` host is ignored in code and redirected to `zbrendiraj.si`.

## Stripe Dashboard

1. Product **Zbrendiraj spletna stran** with recurring prices **35 EUR/mo** and **350 EUR/yr** (tax inclusive).
2. Configure tax (Stripe Tax for SI, or inclusive tax rate) and set `STRIPE_TAX_RATE_ID` only if it matches inclusive pricing. Without a fixed rate, checkout tries Stripe Tax (`automatic_tax`), which requires Tax registration for Slovenia in the Dashboard.
3. When going live: replace test `STRIPE_SECRET_KEY` and `STRIPE_PRICE_*` on Vercel with live IDs.
4. Webhook endpoint: `https://zbrendiraj.si/api/webhooks/stripe`
   - Event: `checkout.session.completed`
5. Local test: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Flow

1. Demo pages (all appearances except `zbrendiraj`) show a purchase bar when the lead is not already `customer`.
2. `POST /api/checkout` with `{ slug, plan: "monthly" | "yearly" }` creates a Checkout Session and returns `{ url }`.
3. After payment, Stripe hits the webhook → lead `status: customer` + Stripe IDs → email to `CHECKOUT_NOTIFY_EMAIL`.
4. Buyer lands on `/{slug}/hvala` (also via `/demo/{slug}/hvala`).

## Upsells (planned)

After the subscription is paid, Stripe can show **Checkout Upsells** (one-time products) before redirecting to `/hvala`. Catalog stub: [`src/billing/addons.ts`](../src/billing/addons.ts).

Planned add-ons:

| ID | Label | Env |
|----|--------|-----|
| `business_email` | Poslovni mail | `STRIPE_PRICE_ADDON_EMAIL` |
| `gbp_update` | Google Business Profile update | `STRIPE_PRICE_ADDON_GBP` |
| `review_board` | Google review tabla NFC + QR | `STRIPE_PRICE_ADDON_REVIEW_BOARD` |

Setup later:

1. Create **one-time** Prices in Stripe for each add-on.
2. Enable [Checkout Upsells](https://docs.stripe.com/payments/checkout/upsells) and attach those products.
3. Wire session create / webhook metadata when env price IDs are set (`listConfiguredAddons()`).
4. Ops: include purchased add-ons in the notify email.

Not implemented in checkout session create yet — avoid dead code without live price IDs.

## Notes

- Lead updates use the same file store as outreach webhooks; the Resend notification is the reliable ops signal on Vercel.
- Customer portal / cancel UI and automatic domain provisioning are out of scope for this pass.
