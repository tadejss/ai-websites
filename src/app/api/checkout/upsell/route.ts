import { NextResponse } from "next/server";
import {
  getUpsellDefinition,
  getUpsellPriceId,
  isUpsellType,
} from "@/billing/upsells";
import {
  getStripe,
  resolveTaxRateId,
} from "@/billing/stripe";
import { verifyBaseCheckout } from "@/billing/verify-checkout-session";
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

function upsellSuccessUrl(
  slug: string,
  originalSessionId: string,
  request: Request,
): string {
  const path = `/${slug}/upsell?session_id=${encodeURIComponent(originalSessionId)}`;
  const origin = resolveRequestOrigin(request);
  if (origin) {
    return `${origin}${path}`;
  }
  return toAbsoluteUrl(path) || path;
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

  const lead = readLead(slug);
  if (hasPurchasedUpsell(lead, upsellType)) {
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
  const successUrl = upsellSuccessUrl(slug, sessionId, request);
  const cancelUrl = successUrl;

  try {
    const stripe = getStripe();
    const taxRateId = await resolveTaxRateId(stripe);

    const session = await stripe.checkout.sessions.create({
      mode: definition.mode,
      locale: "sl",
      customer: verified.customerId,
      client_reference_id: slug,
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: "required",
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
        : {}),
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
