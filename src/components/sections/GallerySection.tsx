"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { isGallerySectionVisible } from "@/content/sections";
import type { GalleryItem, SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
  headingVariant?: "default" | "beauty" | "trade";
};

export function GallerySection({
  siteConfig,
  headingVariant = "default",
}: Props) {
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!lightbox) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightbox(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox]);

  if (!isGallerySectionVisible(siteConfig) || !siteConfig.gallery) {
    return null;
  }

  const { gallery } = siteConfig;

  return (
    <>
      <Section id={gallery.id}>
        <SectionHeading
          eyebrow={gallery.eyebrow}
          title={gallery.title}
          description={gallery.description}
          variant={headingVariant}
        />

        <div className="mt-16 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {gallery.items.map((item) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setLightbox(item)}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt}
                className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
              {item.caption ? (
                <span className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2 text-xs text-white truncate">
                  {item.caption}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </Section>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setLightbox(null)}
          role="presentation"
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-surface shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={lightbox.alt}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-sm text-white hover:bg-black/80"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              className="max-h-[80vh] max-w-full object-contain"
            />
            {(lightbox.caption || lightbox.alt) && (
              <p className="border-t border-border px-4 py-3 text-sm text-muted">
                {lightbox.caption ?? lightbox.alt}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
