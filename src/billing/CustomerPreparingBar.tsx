"use client";

import Link from "next/link";
import { extractOwnerFirstName } from "@/billing/owner-first-name";
import type { OnboardingStatus } from "@/onboarding/types";

type Props = {
  slug: string;
  onboardingUrl: string | null;
  onboardingStatus?: OnboardingStatus | null;
  companyName?: string | null;
  brandHighlight?: string | null;
  contactName?: string | null;
};

export function CustomerPreparingBar({
  slug,
  onboardingUrl,
  onboardingStatus,
  companyName,
  brandHighlight,
  contactName,
}: Props) {
  if (onboardingStatus === "live") {
    return null;
  }

  const firstName =
    contactName?.trim() ||
    extractOwnerFirstName(companyName, brandHighlight);

  let headline = firstName
    ? `${firstName}, tvojo stran pripravljamo na objavo.`
    : "Tvojo stran pripravljamo na objavo.";

  let subtitle = "Za naslednji korak izpolni podatke o podjetju.";

  if (
    onboardingStatus === "approved_for_publish" ||
    onboardingStatus === "publishing"
  ) {
    headline = firstName
      ? `${firstName}, tvoja stran je v objavi.`
      : "Tvoja stran je v objavi.";
    subtitle =
      "Potrdili smo tvoje podatke. Kmalu bo stran na voljo na zbrendiraj.si/" +
      slug;
  } else if (onboardingStatus === "publish_failed") {
    headline = "Pri objavi je prišlo do težave.";
    subtitle =
      "Naša ekipa že rešuje — kmalu te bomo kontaktirali ali poskusili znova.";
  } else if (
    onboardingStatus === "submitted" ||
    onboardingStatus === "processing" ||
    onboardingStatus === "ready_for_approval"
  ) {
    headline = firstName
      ? `${firstName}, prejeli smo tvoje podatke.`
      : "Prejeli smo tvoje podatke.";
    subtitle =
      "Pregledamo vsebino in pripravimo končno različico. Lahko še vedno urediš obrazec.";
  }

  return (
    <>
      <div className="h-36 sm:h-28" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto max-w-4xl rounded-2xl border border-black/10 bg-zinc-950 px-4 py-3.5 text-white shadow-2xl sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight">{headline}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
            </div>
            {onboardingUrl &&
            onboardingStatus !== "approved_for_publish" &&
            onboardingStatus !== "publishing" ? (
              <Link
                href={onboardingUrl}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-lime-200"
              >
                Izpolni podatke za svojo stran
              </Link>
            ) : onboardingStatus === "publish_failed" ? (
              <a
                href="mailto:info@zbrendiraj.si"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                Kontaktiraj nas
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
