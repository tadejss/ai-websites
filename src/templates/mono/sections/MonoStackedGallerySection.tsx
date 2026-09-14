"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SiteConfig } from "@/content/types/site";
import { getMonoMediaPool } from "../mono-media";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoStackedGallerySection({ siteConfig }: Props) {
  const containerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const cards = getMonoMediaPool(siteConfig).slice(0, 4);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowH = window.innerHeight;
    const totalH = containerRef.current.offsetHeight;
    setScrollProgress(Math.max(0, Math.min(1, -rect.top / (totalH - windowH))));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (reduceMotion || cards.length < 2) return;
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll, reduceMotion, cards.length]);

  if (cards.length < 2) {
    return null;
  }

  if (reduceMotion) {
    return (
      <section id="galerija" className="bg-black px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          {cards.map((card, idx) => (
            <div
              key={`${card.src}-${idx}`}
              className="relative aspect-[4/5] overflow-hidden rounded-2xl"
            >
              <Image
                src={card.src}
                alt={card.alt || ""}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const lastIndex = cards.length - 1;
  const lastExitEase =
    1 -
    Math.pow(
      1 - Math.max(0, Math.min(1, (scrollProgress - 0.6) / 0.4)),
      3,
    );

  return (
    <section
      id="galerija"
      ref={containerRef}
      className="relative bg-black"
      style={{ minHeight: `${(cards.length + 1) * 100}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-4">
        <div className="relative h-[70vh] w-full max-w-5xl md:h-[80vh]">
          {cards.map((card, idx) => {
            const isLast = idx === lastIndex;
            const cardProgress = Math.max(
              0,
              Math.min(1, scrollProgress * cards.length - idx),
            );
            const translateY = (1 - cardProgress) * 100;
            let scale = 0.8 + 0.2 * cardProgress;

            if (isLast) {
              const baseScale = 0.8 + 0.2 * cardProgress;
              scale =
                baseScale +
                5 *
                  Math.max(0, cardProgress - 0.8) *
                  (1 + 0.8 * lastExitEase - baseScale);
            }

            const cornerRadius =
              isLast && lastExitEase > 0.3 ? (1 - lastExitEase) * 16 : 16;

            return (
              <div
                key={`${card.src}-${idx}`}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  zIndex: idx,
                  transform: `translate3d(0, ${translateY}%, 0) scale(${scale}) translateZ(0)`,
                  opacity: cardProgress,
                  willChange: "transform, opacity",
                }}
              >
                <div
                  className="relative h-full w-full overflow-hidden shadow-2xl"
                  style={{ borderRadius: `${cornerRadius}px` }}
                >
                  <Image
                    src={card.src}
                    alt={card.alt || ""}
                    fill
                    sizes="(max-width: 1024px) 100vw, 80vw"
                    className="object-cover"
                    priority={idx < 2}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
