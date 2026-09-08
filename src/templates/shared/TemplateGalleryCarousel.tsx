"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryItem } from "@/content/types/site";

type Props = {
  items: GalleryItem[];
  /** Visual shell around each slide — matches template art direction. */
  frame?: "soft" | "outline" | "sharp";
  className?: string;
};

function scrollToSlide(
  scroller: HTMLDivElement,
  direction: -1 | 1,
) {
  const slides = [...scroller.querySelectorAll<HTMLElement>("[data-slide]")];
  if (slides.length === 0) {
    return;
  }

  const center = scroller.scrollLeft + scroller.clientWidth / 2;
  let active = 0;
  let best = Number.POSITIVE_INFINITY;
  slides.forEach((slide, index) => {
    const mid = slide.offsetLeft + slide.offsetWidth / 2;
    const dist = Math.abs(mid - center);
    if (dist < best) {
      best = dist;
      active = index;
    }
  });

  const next = Math.max(0, Math.min(slides.length - 1, active + direction));
  slides[next]?.scrollIntoView({
    behavior: "smooth",
    inline: "center",
    block: "nearest",
  });
}

const frameClass: Record<NonNullable<Props["frame"]>, string> = {
  soft: "overflow-hidden rounded-[var(--radius)] bg-[var(--surface)]",
  outline: "border-2 border-[var(--border)] bg-[var(--surface)] p-1",
  sharp: "overflow-hidden bg-[var(--surface)]",
};

/** Horizontal snap carousel for template galleries. */
export function TemplateGalleryCarousel({
  items,
  frame = "soft",
  className = "",
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateControls = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    setCanPrev(scroller.scrollLeft > 4);
    setCanNext(scroller.scrollLeft < maxScroll - 4);

    const slides = [...scroller.querySelectorAll<HTMLElement>("[data-slide]")];
    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let active = 0;
    let best = Number.POSITIVE_INFINITY;
    slides.forEach((slide, index) => {
      const mid = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(mid - center);
      if (dist < best) {
        best = dist;
        active = index;
      }
    });
    setActiveIndex(active);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    updateControls();
    scroller.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);
    return () => {
      scroller.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
    };
  }, [items, updateControls]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollerRef}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-roledescription="carousel"
        aria-label="Galerija"
      >
        {items.map((item, index) => (
          <figure
            key={`${item.src}-${index}`}
            data-slide
            className={`w-[85%] shrink-0 snap-center sm:w-[70%] lg:w-[55%] ${frameClass[frame]}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.alt}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className="aspect-[4/5] w-full object-cover"
            />
            {item.caption ? (
              <figcaption className="truncate px-3 py-2 text-xs text-[var(--muted)]">
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {items.length > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {items.map((item, index) => (
              <span
                key={`${item.src}-dot-${index}`}
                className={`h-1.5 w-1.5 rounded-full transition-opacity ${
                  index === activeIndex
                    ? "bg-[var(--accent)] opacity-100"
                    : "bg-[var(--foreground)] opacity-25"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Prejšnja slika"
              disabled={!canPrev}
              onClick={() => {
                const scroller = scrollerRef.current;
                if (scroller) {
                  scrollToSlide(scroller, -1);
                }
              }}
              className="inline-flex size-10 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-opacity disabled:opacity-30"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              aria-label="Naslednja slika"
              disabled={!canNext}
              onClick={() => {
                const scroller = scrollerRef.current;
                if (scroller) {
                  scrollToSlide(scroller, 1);
                }
              }}
              className="inline-flex size-10 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-opacity disabled:opacity-30"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
