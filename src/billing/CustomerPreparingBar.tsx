"use client";

import Link from "next/link";
import { extractOwnerFirstName } from "@/billing/owner-first-name";

type Props = {
  slug: string;
  onboardingUrl: string;
  companyName?: string | null;
  brandHighlight?: string | null;
  contactName?: string | null;
};

export function CustomerPreparingBar({
  slug,
  onboardingUrl,
  companyName,
  brandHighlight,
  contactName,
}: Props) {
  const firstName =
    contactName?.trim() ||
    extractOwnerFirstName(companyName, brandHighlight);

  const headline = firstName
    ? `${firstName}, tvojo stran pripravljamo na objavo.`
    : "Tvojo stran pripravljamo na objavo.";

  return (
    <>
      <div className="h-36 sm:h-28" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto max-w-4xl rounded-2xl border border-black/10 bg-zinc-950 px-4 py-3.5 text-white shadow-2xl sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight">{headline}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Za naslednji korak izpolni podatke o podjetju.
              </p>
            </div>
            <Link
              href={onboardingUrl}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-lime-200"
            >
              Izpolni podatke za svojo stran
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
