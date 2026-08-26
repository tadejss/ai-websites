import { NextResponse } from "next/server";
import {
  getPriceIdForPlan,
  getStripe,
  isCheckoutPlan,
  resolveTaxRateId,
  type CheckoutPlan,
} from "@/billing/stripe";
import { getSiteConfig } from "@/content/get-site-config";
import { resolveCheckoutLead } from "@/leads/checkout-lead";
import { resolveRequestOrigin, toAbsoluteUrl } from "@/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutBody = {
  slug?: unknown;
  plan?: unknown;
};

function resolveCheckoutUrls(
  slug: string,
  request: Request,
): {
  successUrl: string;
  cancelUrl: string;
} {
  const successPath = `/${slug}/hvala?session_id={CHECKOUT_SESSION_ID}`;
  const cancelPath = `/${slug}`;

  // Prefer the live request host so cancel/success match zbrendiraj.si (or
  // localhost), even if SITE_URL still points at an old deploy URL.
  const origin = resolveRequestOrigin(request);
  if (origin) {
    return {
      successUrl: `${origin}${successPath}`,
      cancelUrl: `${origin}${cancelPath}`,
    };
  }

  return {
    successUrl: toAbsoluteUrl(successPath) || successPath,
    cancelUrl: toAbsoluteUrl(cancelPath) || cancelPath,
  };
}

export async function POST(request: Request) {
  let body: CheckoutBody;

  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const plan = body.plan;

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  if (!isCheckoutPlan(plan)) {
    return NextResponse.json(
      { error: 'Plan must be "monthly" or "yearly"' },
      { status: 400 },
    );
  }

  try {
    getSiteConfig(slug);
  } catch {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const lead = resolveCheckoutLead(slug);

  if (lead.status === "customer") {
    return NextResponse.json(
      { error: "This site is already subscribed" },
      { status: 409 },
    );
  }

  let priceId: string;

  try {
    priceId = getPriceIdForPlan(plan as CheckoutPlan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Price not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const { successUrl, cancelUrl } = resolveCheckoutUrls(slug, request);

  try {
    const stripe = getStripe();
    const taxRateId = await resolveTaxRateId(stripe);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      locale: "sl",
      client_reference_id: slug,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      metadata: {
        slug,
        plan,
      },
      subscription_data: {
        metadata: {
          slug,
          plan,
        },
      },
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
      error instanceof Error ? error.message : "Checkout session failed";
    console.error("[checkout]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
