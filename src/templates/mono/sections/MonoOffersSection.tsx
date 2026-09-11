"use client";

import type { SiteConfig } from "@/content/types/site";
import { FadeImage } from "../components/FadeImage";
import { getOfferItems, getOfferSectionMeta } from "../../shared/section-data";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoOffersSection({ siteConfig }: Props) {
  const offerMeta = getOfferSectionMeta(siteConfig);
  const offers = getOfferItems(siteConfig);

  const fallbackOffers = [
    {
      id: "compact",
      name: "Kompaktni model",
      description: "120 m² bivalne površine z optimalno energetsko učinkovitostjo",
      price: "285.000 €",
      image: "/templates/mono/hero-side-1.png",
    },
    {
      id: "standard",
      name: "Standardni model",
      description: "180 m² popolno ravnovesje prostornosti in trajnosti",
      price: "395.000 €",
      image: "/templates/mono/hero-side-2.png",
    },
    {
      id: "premium",
      name: "Premijski model",
      description: "250 m² odprt arhitekturni dizajn z maksimalnim udobjem",
      price: "525.000 €",
      image: "/templates/mono/hero-side-4.png",
    },
  ];

  const items =
    offers.length > 0
      ? offers.slice(0, 3).map((item, idx) => ({
          id: String(idx + 1),
          name: item.name,
          description: item.description || "Vrhunska izvedba po meri vaših želja",
          price: item.price ? `${item.price}${item.unit ? ` / ${item.unit}` : ""}` : fallbackOffers[idx % fallbackOffers.length].price,
          image: fallbackOffers[idx % fallbackOffers.length].image,
        }))
      : fallbackOffers;

  return (
    <section id="ponudba" className="bg-[var(--background)]">
      <div className="px-6 py-20 md:px-12 lg:px-20 md:py-16">
        <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-mono mb-2">
          {offerMeta.eyebrow || "Izbira modelov"}
        </p>
        <h2 className="text-3xl font-medium tracking-tight text-[var(--foreground)] md:text-4xl">
          {offerMeta.title || "Prostorske možnosti"}
        </h2>
      </div>

      <div className="pb-24">
        {/* Mobile Horizontal Snap-Scroll */}
        <div className="flex gap-6 overflow-x-auto px-6 pb-4 md:hidden snap-x snap-mandatory scrollbar-hide">
          {items.map((item) => (
            <div key={item.id} className="group flex-shrink-0 w-[78vw] snap-center">
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[var(--surface)] shadow-md">
                <FadeImage
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="80vw"
                  className="object-cover group-hover:scale-105"
                />
              </div>
              <div className="py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium leading-snug text-[var(--foreground)]">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-lg font-medium text-[var(--foreground)] shrink-0">
                    {item.price}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop 3-Column Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 md:px-12 lg:px-20">
          {items.map((item) => (
            <div key={item.id} className="group">
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[var(--surface)] shadow-md">
                <FadeImage
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="33vw"
                  className="object-cover group-hover:scale-105"
                />
              </div>
              <div className="py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium leading-snug text-[var(--foreground)]">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {item.description}
                    </p>
                  </div>
                  <span className="font-medium text-[var(--foreground)] text-2xl shrink-0">
                    {item.price}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
