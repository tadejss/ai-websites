import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isCustomer } from "@/customers/store";
import { getSiteConfig } from "@/content/get-site-config";
import { buildOnboardingPrefill } from "@/onboarding/prefill";
import { getOnboardingBySlug } from "@/onboarding/store";
import { verifyOnboardingCapabilityToken } from "@/onboarding/auth";
import {
  ONBOARDING_SESSION_COOKIE,
  createOnboardingSession,
  getOnboardingSessionCookieOptions,
  validateOnboardingSession,
} from "@/lib/onboarding-session";
import { resolveClientIp, fingerprintSecret, hashRateLimitMaterial } from "@/lib/client-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { isDatabaseConfigured } from "@/db/client";
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

function Denied({ title, body }: { title: string; body: ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-4 text-zinc-400">{body}</p>
      </div>
    </main>
  );
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
      <Denied
        title="Dostop zavrnjen"
        body="Ta vsebina je na voljo samo strankam z aktivno naročnino."
      />
    );
  }

  if (!isDatabaseConfigured()) {
    return (
      <Denied
        title="Začasno nedosegljivo"
        body="Poskusi znova čez nekaj minut."
      />
    );
  }

  const cookieStore = await cookies();
  const existingSession = cookieStore.get(ONBOARDING_SESSION_COOKIE)?.value;

  // Magic-link exchange: capability token → short-lived session cookie, then
  // strip the token from the URL so it is not retained in history/address bar.
  if (token?.trim()) {
    const headerStore = await headers();
    const ip = resolveClientIp(headerStore);
    const tokenFp = await fingerprintSecret(token.trim());
    const rateKey = await hashRateLimitMaterial(
      `onboarding-exchange:${ip}:${slug}:${tokenFp}`,
    );
    const limited = await checkRateLimit({
      key: rateKey,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!limited.allowed) {
      return (
        <Denied
          title="Preveč poskusov"
          body="Poskusi znova čez nekaj minut."
        />
      );
    }

    const access = await verifyOnboardingCapabilityToken(slug, token);
    if (!access.ok) {
      return (
        <Denied
          title="Neveljavna povezava"
          body={
            <>
              Preveri povezavo iz emaila ali nas kontaktiraj na{" "}
              <a
                className="text-lime-300 underline"
                href="mailto:info@zbrendiraj.si"
              >
                info@zbrendiraj.si
              </a>
              .
            </>
          }
        />
      );
    }

    const session = await createOnboardingSession(slug);
    cookieStore.set(
      ONBOARDING_SESSION_COOKIE,
      session.token,
      getOnboardingSessionCookieOptions(session.expiresAt),
    );
    redirect(`/${slug}/vsebina`);
  }

  const session = await validateOnboardingSession(existingSession, slug);
  if (!session.ok) {
    return (
      <Denied
        title="Neveljavna povezava"
        body={
          <>
            Odpri povezavo iz emaila znova ali nas kontaktiraj na{" "}
            <a
              className="text-lime-300 underline"
              href="mailto:info@zbrendiraj.si"
            >
              info@zbrendiraj.si
            </a>
            .
          </>
        }
      />
    );
  }

  const onboarding = await getOnboardingBySlug(slug);
  if (!onboarding) {
    return (
      <Denied
        title="Neveljavna povezava"
        body="Onboarding zapis ni na voljo."
      />
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
