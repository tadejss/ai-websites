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

# Optional post-purchase upsells (after base subscription)
STRIPE_PRICE_UPSELL_GOOGLE_BUSINESS=price_...
STRIPE_PRICE_UPSELL_SEO=price_...
STRIPE_PRICE_UPSELL_EMAIL=price_...
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
4. Buyer lands on `/{slug}/upsell?session_id={CHECKOUT_SESSION_ID}`.
5. Optional upsells via `POST /api/checkout/upsell` → separate Stripe Checkout per upsell → back to upsell page.
6. **Nadaljuj →** leads to `/{slug}/hvala?session_id=...`.

## Post-purchase upsells

Implemented at [`src/billing/upsells.ts`](../src/billing/upsells.ts) and [`src/app/[slug]/upsell/page.tsx`](../src/app/[slug]/upsell/page.tsx).

| `upsell_type` | Product | Stripe mode | Env |
|---------------|---------|-------------|-----|
| `google_business` | Google Business profil (39 €) | `payment` | `STRIPE_PRICE_UPSELL_GOOGLE_BUSINESS` |
| `seo` | Osnovna SEO (29 €) | `payment` | `STRIPE_PRICE_UPSELL_SEO` |
| `professional_email` | Profesionalni e-mail (5 €/mes) | `subscription` | `STRIPE_PRICE_UPSELL_EMAIL` |

Upsell checkout reuses the **same Stripe customer** from the base subscription. Metadata on upsell sessions: `upsell_type`, `slug`, `original_checkout_session_id`, `original_customer_id`.

Webhook `checkout.session.completed` with `metadata.upsell_type` records purchase in lead (`purchasedUpsells`, `upsellRecords`) and sends ops email.

Purchased upsells show **✓ Dodano** on the upsell page; duplicate purchase is blocked server-side.

## Issuer / invoices / receipts

Customer-facing Stripe PDFs and emails use **Dashboard** business settings, not app code.

### Dashboard checklist (live)

1. **Settings → Business → Business details / Public details**
   - **Legal business name:** `DETAJL, Tadej Šarabon Štojs s.p.`
   - Brand / statement descriptor can stay `Zbrendiraj.si`
   - Support address: `Langusova ulica 28, 4240 Radovljica`
   - Support email + website URL filled in
2. **Settings → Billing → Invoices → Invoice tax information**
   - Add account tax ID: **SI95610359** (Slovenian VAT)
   - Set as **default** so it appears on all invoice PDFs
3. **Settings → Business → Customer emails**
   - **Successful payments** on (receipts)
4. **Settings → Billing → Subscriptions and emails**
   - Enable emails for paid / finalized subscription invoices
5. Tax rate `STRIPE_TAX_RATE_ID` must be **22 % inclusive** (matches product prices)

### Code behavior

| Product | Mode | Document |
|---------|------|----------|
| Monthly / yearly site | `subscription` | Stripe Invoice (automatic) |
| Professional email upsell | `subscription` | Stripe Invoice (automatic) |
| GBO / SEO upsells | `payment` + `invoice_creation.enabled` | Paid Invoice + receipt links |

One-time upsell invoices include a footer from [`src/billing/seller.ts`](../src/billing/seller.ts). Legal name + VAT on the PDF header still come from Dashboard Account tax IDs / Public details.

## Notes

- Lead updates use the same file store as outreach webhooks; the Resend notification is the reliable ops signal on Vercel.
- Customer portal / cancel UI and automatic domain provisioning are out of scope for this pass.
