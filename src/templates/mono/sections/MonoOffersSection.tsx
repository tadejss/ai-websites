"use client";

import type { SiteConfig } from "@/content/types/site";
import { FadeImage } from "../components/FadeImage";
import {
  getOfferItems,
  getOfferSectionMeta,
  isOfferVisible,
} from "../../shared/section-data";
import { fillMonoMedia, getMonoMediaPool } from "../mono-media";

type Props = {
  siteConfig: SiteConfig;
};

function chunkPairs<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }
  return pairs;
}

export function MonoOffersSection({ siteConfig }: Props) {
  if (!isOfferVisible(siteConfig)) {
    return null;
  }

  const offerMeta = getOfferSectionMeta(siteConfig);
  const offers = getOfferItems(siteConfig);
  if (offers.length === 0) {
    return null;
  }

  const media = fillMonoMedia(getMonoMediaPool(siteConfig), offers.length);
  const items = offers.slice(0, 6).map((item, idx) => ({
    id: String(idx + 1),
    name: item.name,
    description: item.description || "",
    price: item.price
      ? `${item.price}${item.unit ? ` / ${item.unit}` : ""}`
      : "",
    image: media[idx]?.src || siteConfig.images?.services?.src || "",
  }));
  const pairs = chunkPairs(items);

  return (
    <section id="ponudba" className="bg-[var(--background)]">
      <div className="px-4 py-14 sm:px-6 md:px-12 md:py-16 lg:px-20">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
          {offerMeta.eyebrow || "Kaj delamo"}
        </p>
        <h2 className="text-3xl font-medium tracking-tight text-[var(--foreground)] md:text-4xl">
          {offerMeta.title || "Storitve"}
        </h2>
        {offerMeta.description ? (
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)] md:text-base">
            {offerMeta.description}
          </p>
        ) : null}
      </div>

      <div className="pb-16 md:pb-24">
        {/* Mobile: two services visible, magnetic snap per pair */}
        <div
          className="flex snap-x snap-mandatory overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden"
          style={{ scrollPaddingInline: 0 }}
        >
          {pairs.map((pair, pairIdx) => (
            <div
              key={`pair-${pairIdx}`}
              className="grid w-full shrink-0 snap-start grid-cols-2 gap-3 px-4"
            >
              {pair.map((item) => (
                <article key={item.id} className="min-w-0">
                  {item.image ? (
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[var(--surface)]">
                      <FadeImage
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 60vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="pt-3">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="min-w-0 text-sm font-medium leading-snug text-[var(--foreground)]">
                        {item.name}
                      </h3>
                      {item.price ? (
                        <span className="shrink-0 text-sm font-medium tabular-nums text-[var(--foreground)]">
                          {item.price}
                        </span>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>

        <div className="hidden gap-8 md:grid md:grid-cols-3 md:px-12 lg:px-20">
          {items.slice(0, 3).map((item) => (
            <div key={item.id} className="group">
              {item.image ? (
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[var(--surface)] shadow-md">
                  <FadeImage
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105"
                  />
                </div>
              ) : null}
              <div className="py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-medium leading-snug text-[var(--foreground)]">
                      {item.name}
                    </h3>
                    {item.description ? (
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  {item.price ? (
                    <span className="shrink-0 text-2xl font-medium text-[var(--foreground)]">
                      {item.price}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {offerMeta.disclaimer ? (
          <p className="mt-4 px-4 text-xs text-[var(--muted)] sm:px-6 md:px-12 lg:px-20">
            {offerMeta.disclaimer}
          </p>
        ) : null}
      </div>
    </section>
  );
}
