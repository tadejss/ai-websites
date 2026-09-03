import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listUpsellDefinitions } from "@/billing/upsells";
import {
  confirmUpsellReturn,
  syncUpsellsForBaseSession,
  verifyBaseCheckout,
} from "@/billing/verify-checkout-session";
import { getSiteConfig } from "@/content/get-site-config";
import { siteSlugs } from "@/content/sites";
import { getPurchasedUpsellTypes } from "@/leads/upsell-store";
import { UpsellOffers } from "./UpsellOffers";
import { withBrandIcons } from "@/lib/branding";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    session_id?: string;
    upsell_session_id?: string;
  }>;
};

export function generateStaticParams() {
  return siteSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const config = getSiteConfig(slug);
    const name = `${config.brand.prefix} ${config.brand.highlight}`.trim();
    return withBrandIcons(
      {
        title: `Dodatki – ${name}`,
        robots: { index: false, follow: false },
      },
      config,
    );
  } catch {
    return { title: "Dodatki" };
  }
}

export default async function UpsellPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const {
    session_id: sessionId,
    upsell_session_id: upsellSessionId,
  } = await searchParams;

  try {
    getSiteConfig(slug);
  } catch {
    notFound();
  }

  if (!sessionId?.startsWith("cs_")) {
    redirect(`/${slug}`);
  }

  const verified = await verifyBaseCheckout(sessionId, slug);
  if (!verified) {
    redirect(`/${slug}`);
  }

  // Confirm the upsell session Stripe just redirected from (if present).
  let confirmedType: string | null = null;
  try {
    confirmedType = await confirmUpsellReturn(
      upsellSessionId,
      slug,
      sessionId,
    );
  } catch (error) {
    console.warn(
      "[upsell-page] confirmUpsellReturn failed:",
      error instanceof Error ? error.message : error,
    );
  }

  let purchasedFromStripe: string[] = [];
  try {
    purchasedFromStripe = await syncUpsellsForBaseSession(
      verified.customerId,
      slug,
      sessionId,
    );
  } catch (error) {
    console.warn(
      "[upsell-page] syncUpsellsForBaseSession failed:",
      error instanceof Error ? error.message : error,
    );
  }

  const purchasedFromDb = await getPurchasedUpsellTypes(slug);
  const purchasedTypes = [
    ...new Set([
      ...purchasedFromDb,
      ...purchasedFromStripe,
      ...(confirmedType ? [confirmedType] : []),
    ]),
  ] as Awaited<ReturnType<typeof getPurchasedUpsellTypes>>;

  const definitions = listUpsellDefinitions();
  const hvalaHref = `/${slug}/hvala?session_id=${encodeURIComponent(sessionId)}`;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-white sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
          Zbrendiraj.si
        </p>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
          Naročilo potrjeno 🎉
        </h1>
        <p className="mt-3 text-lg text-zinc-300">
          Tvoja spletna stran je sedaj v izdelavi.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
          Preden zaključimo, lahko svojemu paketu dodaš še nekaj stvari, ki jih
          naše stranke pogosto uredijo skupaj s spletno stranjo.
        </p>

        <UpsellOffers
          slug={slug}
          sessionId={sessionId}
          definitions={definitions}
          purchasedTypes={purchasedTypes}
        />

        <div className="mt-12 border-t border-white/10 pt-10 text-center">
          <p className="text-sm text-zinc-400">Ne želiš ničesar dodatnega?</p>
          <p className="mt-1 text-sm text-zinc-500">
            Ni problema. Tvoja spletna stran je že naročena in gre v izdelavo.
          </p>
          <Link
            href={hvalaHref}
            className="mt-6 inline-flex rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            Nadaljuj →
          </Link>
        </div>
      </div>
    </main>
  );
}
