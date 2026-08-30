import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteConfig } from "@/content/get-site-config";
import { siteSlugs } from "@/content/sites";
import { getCustomerChromeState } from "@/onboarding/customer-chrome";

type Props = {
  params: Promise<{
    slug: string;
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
    return {
      title: `Hvala – ${name}`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Hvala" };
  }
}

export default async function ThankYouPage({ params }: Props) {
  const { slug } = await params;

  let brandName = slug;

  try {
    const config = getSiteConfig(slug);
    brandName = `${config.brand.prefix} ${config.brand.highlight}`.trim();
  } catch {
    notFound();
  }

  const { isCustomer, onboardingUrl } = await getCustomerChromeState(slug);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
          Zbrendiraj.si
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          {isCustomer ? "Plačilo je uspešno" : "Hvala za naročnino"}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
          {isCustomer
            ? `Tvojo stran za ${brandName} zdaj pripravljamo na objavo. Za naslednji korak izpolni podatke o podjetju.`
            : `Plačilo za ${brandName} smo prejeli. Potrditev naročnine obdelujemo — v nekaj minutah bo aktivna.`}
        </p>

        {isCustomer && onboardingUrl ? (
          <Link
            href={onboardingUrl}
            className="mt-10 inline-flex rounded-full bg-lime-300 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-lime-200"
          >
            Izpolni podatke za svojo stran
          </Link>
        ) : null}

        <ul className="mt-10 space-y-3 text-left text-sm text-zinc-300">
          <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            {isCustomer
              ? "Po oddaji podatkov pripravimo končno različico strani in vas obvestimo pred objavo."
              : "Preverimo podatke in ti pošljemo povezavo za ureditev vsebine."}
          </li>
          <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            Pri letnem planu: + GRATIS DOMENA (če je na voljo).
          </li>
          <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            Vprašanja:{" "}
            <a
              className="text-lime-300 underline-offset-2 hover:underline"
              href="mailto:info@zbrendiraj.si"
            >
              info@zbrendiraj.si
            </a>
          </li>
        </ul>

        <Link
          href={`/${slug}`}
          className="mt-12 inline-flex rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Nazaj na stran
        </Link>
      </div>
    </main>
  );
}
