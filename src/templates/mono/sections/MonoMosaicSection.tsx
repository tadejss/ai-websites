"use client";

import type { SiteConfig } from "@/content/types/site";
import { FadeImage } from "../components/FadeImage";
import { fillMonoMedia, getMonoMediaPool } from "../mono-media";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoMosaicSection({ siteConfig }: Props) {
  const pool = getMonoMediaPool(siteConfig);
  if (pool.length === 0) {
    return null;
  }

  const layoutSpans = [
    "col-span-2 row-span-2",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-1 row-span-2",
    "col-span-1 row-span-1",
    "col-span-2 row-span-1",
    "col-span-1 row-span-1",
    "col-span-1 row-span-2",
    "col-span-2 row-span-1",
    "col-span-1 row-span-1",
  ];

  const slotCount = Math.min(10, Math.max(4, pool.length));
  const filled = fillMonoMedia(pool, slotCount);
  const items = filled.map((item, idx) => ({
    ...item,
    span: layoutSpans[idx % layoutSpans.length]!,
  }));

  const eyebrow =
    siteConfig.gallery?.eyebrow?.trim() ||
    siteConfig.services.eyebrow?.trim() ||
    "Ambient";
  const title =
    siteConfig.gallery?.title?.trim() ||
    "Detajli, ki oblikujejo vtise";

  return (
    <section id="tehnologija" className="relative bg-[var(--background)] py-20 md:py-32">
      <div className="px-4 md:px-12 lg:px-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
            {eyebrow}
          </p>
          <h2 className="text-3xl font-medium tracking-tight text-[var(--foreground)] md:text-4xl">
            {title}
          </h2>
        </div>
        <div className="mx-auto grid w-full max-w-7xl auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4 md:gap-4">
          {items.map((item, idx) => (
            <div
              key={`${item.src}-${idx}`}
              className={`relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] ${item.span}`}
            >
              <FadeImage
                src={item.src}
                alt={item.alt || title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                fadeDelay={idx * 60}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
