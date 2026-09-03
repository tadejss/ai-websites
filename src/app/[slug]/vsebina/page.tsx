import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isCustomer } from "@/customers/store";
import { getSiteConfig } from "@/content/get-site-config";
import { buildOnboardingPrefill } from "@/onboarding/prefill";
import {
  getOnboardingBySlug,
  isValidOnboardingToken,
} from "@/onboarding/store";
import { OnboardingForm } from "./OnboardingForm";
import { withBrandIcons } from "@/lib/branding";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const config = getSiteConfig(slug);
    const name = `${config.brand.prefix} ${config.brand.highlight}`.trim();
    return withBrandIcons(
      {
        title: `Podatki za stran – ${name}`,
        robots: { index: false, follow: false },
      },
      config,
    );
  } catch {
    return {
      title: "Podatki za stran",
      robots: { index: false, follow: false },
    };
  }
}

export default async function OnboardingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { token } = await searchParams;

  try {
    getSiteConfig(slug);
  } catch {
    notFound();
  }

  if (!(await isCustomer(slug))) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-semibold">Dostop zavrnjen</h1>
          <p className="mt-4 text-zinc-400">
            Ta vsebina je na voljo samo strankam z aktivno naročnino.
          </p>
        </div>
      </main>
    );
  }

  const onboarding = await getOnboardingBySlug(slug);
  if (!onboarding || !isValidOnboardingToken(onboarding, token)) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-semibold">Neveljavna povezava</h1>
          <p className="mt-4 text-zinc-400">
            Preveri povezavo iz emaila ali nas kontaktiraj na{" "}
            <a className="text-lime-300 underline" href="mailto:info@zbrendiraj.si">
              info@zbrendiraj.si
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  const prefill = buildOnboardingPrefill(slug, onboarding);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-white sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
          Zbrendiraj.si
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Podatki za tvojo spletno stran
        </h1>
        <p className="mt-3 text-zinc-400">
          Izpolni kratki vprašalnik — demo stran bomo prilagodili tvojemu podjetju.
        </p>

        <div className="mt-8">
          <OnboardingForm
            slug={slug}
            token={token!}
            initialPrefill={prefill}
            initialStatus={onboarding.status}
          />
        </div>

        <Link
          href={`/${slug}`}
          className="mt-10 inline-block text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Nazaj na demo stran
        </Link>
      </div>
    </main>
  );
}
