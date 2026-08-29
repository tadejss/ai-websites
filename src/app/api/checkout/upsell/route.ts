import { NextResponse } from "next/server";
import {
  getUpsellDefinition,
  getUpsellPriceId,
  isUpsellType,
} from "@/billing/upsells";
import { sellerInvoiceFooter } from "@/billing/seller";
import {
  getStripe,
  resolveTaxRateId,
} from "@/billing/stripe";
import {
  hydrateCustomerFromSession,
  listPurchasedUpsellTypesFromStripe,
  verifyBaseCheckout,
} from "@/billing/verify-checkout-session";
import { hasPurchasedUpsell } from "@/leads/upsell-store";
import { readLead } from "@/leads/store";
import { resolveRequestOrigin, toAbsoluteUrl } from "@/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpsellBody = {
  session_id?: unknown;
  upsell_type?: unknown;
  slug?: unknown;
};

function absoluteUrl(path: string, request: Request): string {
  const origin = resolveRequestOrigin(request);
  if (origin) {
    return `${origin}${path}`;
  }
  const absolute = toAbsoluteUrl(path);
  if (absolute.startsWith("http://") || absolute.startsWith("https://")) {
    return absolute;
  }
  throw new Error("Could not resolve absolute checkout return URL");
}

function upsellReturnUrls(
  slug: string,
  originalSessionId: string,
  request: Request,
): { successUrl: string; cancelUrl: string } {
  // Keep the original base session for re-entry; Stripe replaces
  // {CHECKOUT_SESSION_ID} with this upsell session so we can confirm purchase.
  const successPath =
    `/${slug}/upsell` +
    `?session_id=${encodeURIComponent(originalSessionId)}` +
    `&upsell_session_id={CHECKOUT_SESSION_ID}`;
  const cancelPath =
    `/${slug}/upsell?session_id=${encodeURIComponent(originalSessionId)}`;

  return {
    successUrl: absoluteUrl(successPath, request),
    cancelUrl: absoluteUrl(cancelPath, request),
  };
}

export async function POST(request: Request) {
  let body: UpsellBody;

  try {
    body = (await request.json()) as UpsellBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const sessionId =
    typeof body.session_id === "string" ? body.session_id.trim() : "";
  const upsellType = body.upsell_type;

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  if (!isUpsellType(upsellType)) {
    return NextResponse.json({ error: "Invalid upsell_type" }, { status: 400 });
  }

  const verified = await verifyBaseCheckout(sessionId, slug);
  if (!verified) {
    return NextResponse.json(
      { error: "Checkout session is not valid for upsells" },
      { status: 403 },
    );
  }

  // Stripe is source of truth (lead file may be ephemeral on Vercel).
  const purchasedFromStripe = await listPurchasedUpsellTypesFromStripe(
    verified.customerId,
    slug,
    sessionId,
  );
  const lead = readLead(slug);
  if (
    hasPurchasedUpsell(lead, upsellType) ||
    purchasedFromStripe.includes(upsellType)
  ) {
    return NextResponse.json(
      { error: "Upsell already purchased" },
      { status: 409 },
    );
  }

  let priceId: string;
  try {
    priceId = getUpsellPriceId(upsellType);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upsell price not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const definition = getUpsellDefinition(upsellType);

  let successUrl: string;
  let cancelUrl: string;
  try {
    ({ successUrl, cancelUrl } = upsellReturnUrls(slug, sessionId, request));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid return URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const stripe = getStripe();

    // Prefill: ensure Customer carries name/address from the base checkout.
    await hydrateCustomerFromSession(verified.customerId, verified.session);

    const taxRateId = await resolveTaxRateId(stripe);

    const session = await stripe.checkout.sessions.create({
      mode: definition.mode,
      locale: "sl",
      customer: verified.customerId,
      // Required when reusing a customer with tax_id_collection / address updates.
      customer_update: {
        name: "auto",
        address: "auto",
      },
      client_reference_id: slug,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Prefer existing Customer address; still collect when Stripe needs it.
      billing_address_collection: "auto",
      tax_id_collection: { enabled: true },
      metadata: {
        slug,
        upsell_type: upsellType,
        original_checkout_session_id: sessionId,
        original_customer_id: verified.customerId,
      },
      ...(definition.mode === "subscription"
        ? {
            subscription_data: {
              metadata: {
                slug,
                upsell_type: upsellType,
                original_checkout_session_id: sessionId,
                original_customer_id: verified.customerId,
              },
            },
          }
        : {
            // One-time GBO / SEO: paid Stripe Invoice (+ receipt links in email).
            invoice_creation: {
              enabled: true,
              invoice_data: {
                description: definition.title,
                footer: sellerInvoiceFooter(),
                rendering_options: {
                  amount_tax_display: "include_inclusive_tax",
                },
              },
            },
          }),
      line_items: [
        {
          price: priceId,
          quantity: 1,
          ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
        },
      ],
      ...(taxRateId
        ? {}
        : {
            automatic_tax: { enabled: true },
          }),
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upsell checkout failed";
    console.error("[checkout/upsell]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
