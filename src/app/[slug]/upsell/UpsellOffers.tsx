"use client";

import { useState } from "react";
import type { UpsellDefinition, UpsellType } from "@/billing/upsells";

type Props = {
  slug: string;
  sessionId: string;
  definitions: UpsellDefinition[];
  purchasedTypes: UpsellType[];
};

export function UpsellOffers({
  slug,
  sessionId,
  definitions,
  purchasedTypes,
}: Props) {
  const [loadingType, setLoadingType] = useState<UpsellType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startUpsell(type: UpsellType) {
    setLoadingType(type);
    setError(null);

    try {
      const response = await fetch("/api/checkout/upsell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          session_id: sessionId,
          upsell_type: type,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Upsell checkout ni uspel");
      }

      window.location.href = data.url;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upsell checkout ni uspel";
      setError(message);
      setLoadingType(null);
    }
  }

  return (
    <div className="mt-10 space-y-4">
      {definitions.map((item) => {
        const purchased = purchasedTypes.includes(item.type);
        const loading = loadingType === item.type;

        return (
          <article
            key={item.type}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lime-300">
                  {item.title}
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
                  {item.headline}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>

                {item.benefits.length > 0 ? (
                  <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
                    {item.benefits.map((benefit) => (
                      <li key={benefit} className="flex gap-2">
                        <span className="text-lime-300" aria-hidden="true">
                          ·
                        </span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {item.example ? (
                  <p className="mt-3 font-mono text-sm text-zinc-300">
                    {item.example}
                  </p>
                ) : null}

                {item.recurringNote ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    {item.recurringNote}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                <div className="text-left sm:text-right">
                  {item.compareAtLabel ? (
                    <p className="text-sm text-zinc-500 line-through">
                      {item.compareAtLabel}
                    </p>
                  ) : null}
                  <p className="text-xl font-semibold text-white">
                    {item.priceLabel}
                  </p>
                </div>

                {purchased ? (
                  <span className="inline-flex rounded-full bg-lime-300/15 px-4 py-2 text-sm font-semibold text-lime-300">
                    ✓ Dodano
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={loading || loadingType !== null}
                    onClick={() => void startUpsell(item.type)}
                    className="inline-flex rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Odpiram…" : item.cta}
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
