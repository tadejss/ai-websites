"use client";

import type { SiteConfig } from "@/content/types/site";
import { FadeImage } from "../components/FadeImage";
import { getGalleryItems } from "../../shared/section-data";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoMosaicSection({ siteConfig }: Props) {
  const galleryItems = getGalleryItems(siteConfig);

  // 10-item asymmetrical grid layout from mono reference
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

  const fallbackImages = [
    "/templates/mono/4312e1bb-e030-4528-b6df-8a6ea69fe384.png",
    "/templates/mono/b2401fa5-4eac-465f-b1f9-014aadc182ee.png",
    "/templates/mono/dd1b32a8-3722-4ea2-8808-10d53532809d.png",
    "/templates/mono/61af06cc-84d0-4031-a0ed-76fc43b1c1e1.png",
    "/templates/mono/249083d2-c49c-4c06-a125-376284d90c42.png",
    "/templates/mono/7638f650-8586-4403-8c13-141921a04f9d.png",
    "/templates/mono/5b3bdb95-fac7-4d22-aa97-98b5d547b2db.png",
    "/templates/mono/634f7bae-77a5-49d0-a0ab-5271a6194e66.png",
    "/templates/mono/09ffa8fd-cdd1-453f-9aa2-d6c702a1f4b5.png",
    "/templates/mono/040e36b1-d16f-474b-a712-a9979e6ab479.png",
  ];

  // Match gallery items or fill with template mono sketch/architecture assets
  const items = layoutSpans.map((span, idx) => {
    const galleryItem = galleryItems[idx];
    return {
      src: galleryItem?.src || fallbackImages[idx % fallbackImages.length],
      alt: galleryItem?.alt || `Arhitekturni načrt in detajli ${idx + 1}`,
      span,
    };
  });

  return (
    <section id="tehnologija" className="relative bg-[var(--background)] py-20 md:py-32">
      <div className="px-4 md:px-12 lg:px-20">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-mono mb-2">
            Inženiring & Arhitektura
          </p>
          <h2 className="text-3xl font-medium tracking-tight text-[var(--foreground)] md:text-4xl">
            Natančnost v vsakem detajlu
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-7xl mx-auto auto-rows-[180px] md:auto-rows-[220px]">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] ${item.span}`}
            >
              <FadeImage
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
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
