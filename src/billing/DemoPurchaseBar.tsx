"use client";

import { useEffect, useState, startTransition } from "react";
import type { CheckoutPlan } from "@/billing/stripe";
import {
  extractOwnerFirstName,
  purchaseBarHeadline,
  purchaseBarSubtitle,
  showcasePurchaseBarHeadline,
  showcasePurchaseBarSubtitle,
} from "@/billing/owner-first-name";

type Props = {
  slug: string;
  variant?: "personalized" | "showcase";
  companyName?: string | null;
  brandHighlight?: string | null;
};

const PLAN_COPY: Record<CheckoutPlan, { label: string; price: string }> = {
  monthly: {
    label: "Mesečno",
    price: "35 €/mes",
  },
  yearly: {
    label: "Letno",
    price: "350 €/leto",
  },
};

export function DemoPurchaseBar({
  slug,
  variant = "personalized",
  companyName,
  brandHighlight,
}: Props) {
  const [show, setShow] = useState(false);
  const [plan, setPlan] = useState<CheckoutPlan>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isShowcase = variant === "showcase";
  const firstName = isShowcase
    ? null
    : extractOwnerFirstName(companyName, brandHighlight);
  const headline = isShowcase
    ? showcasePurchaseBarHeadline()
    : purchaseBarHeadline(firstName);
  const subtitle = isShowcase
    ? showcasePurchaseBarSubtitle(plan)
    : purchaseBarSubtitle(plan);

  useEffect(() => {
    try {
      // Hide in Primeri iframe previews; keep on full demo pages.
      setShow(window.self === window.top);
    } catch {
      setShow(false);
    }
  }, []);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, plan }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout ni uspel");
      }

      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout ni uspel";
      setError(message);
      setLoading(false);
    }
  }

  if (!show) {
    return null;
  }

  const copy = PLAN_COPY[plan];

  const planToggle = (
    <div className="flex shrink-0 items-center rounded-full bg-zinc-900 p-1">
      {(Object.keys(PLAN_COPY) as CheckoutPlan[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => {
            startTransition(() => setPlan(option));
            setError(null);
          }}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            plan === option
              ? "bg-lime-300 text-zinc-950"
              : "text-zinc-300 hover:text-white"
          }`}
        >
          {PLAN_COPY[option].label}
        </button>
      ))}
    </div>
  );

  const orderButton = (
    <button
      type="button"
      disabled={loading}
      onClick={() => void startCheckout()}
      className="shrink-0 rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Odpiram…" : "Naroči"}
    </button>
  );

  return (
    <>
      <div className="h-40 sm:h-28" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto max-w-4xl rounded-2xl border border-black/10 bg-zinc-950 px-4 py-3.5 text-white shadow-2xl sm:px-5 sm:py-4">
          {/* Mobile: 2×2 — title / price, slider / Naroči */}
          <div className="flex flex-col gap-3.5 sm:hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug font-semibold tracking-tight">
                  {headline}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-zinc-400">
                  {subtitle}
                </p>
              </div>
              <p className="shrink-0 pt-0.5 text-base font-semibold whitespace-nowrap text-lime-300">
                {copy.price}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              {planToggle}
              {orderButton}
            </div>
          </div>

          {/* Desktop: single row */}
          <div className="hidden items-center gap-4 sm:flex">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight">{headline}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {subtitle}
              </p>
            </div>
            {planToggle}
            <p className="shrink-0 text-base font-semibold whitespace-nowrap text-zinc-200">
              {copy.price}
            </p>
            {orderButton}
          </div>

          {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
        </div>
      </div>
    </>
  );
}
