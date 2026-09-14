"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SiteConfig } from "@/content/types/site";
import { brandDisplayName } from "../../shared/contact-data";
import { fillMonoMedia, getMonoMediaPool, MONO_KINETIC_QUALITY, MONO_KINETIC_SIZES } from "../mono-media";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoHeroSection({ siteConfig }: Props) {
  const containerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = window.matchMedia("(max-width: 767px)");
    setReduceMotion(mqMotion.matches);
    setIsMobile(mqMobile.matches);
    const onMotion = () => setReduceMotion(mqMotion.matches);
    const onMobile = () => setIsMobile(mqMobile.matches);
    mqMotion.addEventListener("change", onMotion);
    mqMobile.addEventListener("change", onMobile);
    return () => {
      mqMotion.removeEventListener("change", onMotion);
      mqMobile.removeEventListener("change", onMobile);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollHeight = 2 * window.innerHeight;
      setScrollProgress(Math.max(0, Math.min(1, -rect.top / scrollHeight)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reduceMotion]);

  const brandName = (brandDisplayName(siteConfig) || "MONO").toUpperCase();
  const brandWords = brandName.split(/\s+/).filter(Boolean);
  const pool = getMonoMediaPool(siteConfig);
  const heroImageSrc = siteConfig.images?.hero?.src?.trim() || "";
  // Desktop: 4 side panels (5 total with hero). Mobile: 2 side panels (3 total).
  const sideImages = fillMonoMedia(pool, isMobile ? 2 : 4);
  const leftSideImages = isMobile ? sideImages.slice(0, 1) : sideImages.slice(0, 2);
  const rightSideImages = isMobile ? sideImages.slice(1, 2) : sideImages.slice(2, 4);
  const subtitle =
    siteConfig.hero.description?.trim() ||
    [siteConfig.hero.title, siteConfig.hero.titleHighlight]
      .filter(Boolean)
      .join(" ");

  if (!heroImageSrc) {
    return (
      <section className="relative flex min-h-[100svh] items-center bg-[var(--background)]">
        <div className="w-full px-4 py-28 sm:px-6">
          <h1 className="w-full text-left font-bold leading-[0.9] tracking-tighter text-[var(--foreground)]">
            {brandWords.map((word) => (
              <span
                key={word}
                className="block w-full text-[clamp(2.75rem,16vw,6rem)]"
              >
                {word}
              </span>
            ))}
          </h1>
        </div>
      </section>
    );
  }

  if (reduceMotion) {
    return (
      <section className="relative min-h-[100svh] bg-[var(--background)]">
        <div className="relative h-[100svh] w-full overflow-hidden">
          <Image
            src={heroImageSrc}
            alt={siteConfig.images?.hero?.alt || brandName}
            fill
            priority
            quality={MONO_KINETIC_QUALITY}
            sizes={MONO_KINETIC_SIZES}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55" />
          <div className="absolute inset-x-0 top-[18%] z-10 w-full overflow-hidden">
            <h1 className="w-full select-none px-3 font-bold leading-[0.84] tracking-[-0.055em] text-white md:px-6 md:text-center">
              {brandWords.map((word) => (
                <span
                  key={word}
                  className="block w-full whitespace-nowrap text-left text-[calc((100vw-1.5rem)/4.15)] md:text-center md:text-[min(12vw,9rem)]"
                >
                  {word}
                </span>
              ))}
            </h1>
          </div>
          {!isMobile && subtitle ? (
            <div className="absolute inset-x-0 bottom-0 z-10 px-8 pb-16">
              <p className="mx-auto max-w-2xl text-center text-2xl font-light leading-relaxed text-white/95">
                {subtitle}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const progress = scrollProgress;
  const titleOpacity = Math.max(0, 1 - progress / 0.2);
  const openProgress = Math.max(0, Math.min(1, (progress - 0.2) / 0.8));
  // Mobile opens to 3 panels; desktop to 5.
  const sideBudget = isMobile ? 52 : 80;
  const centerWidth = 100 - sideBudget * openProgress;
  const sideWidth = (sideBudget / 2) * openProgress;
  const leftTranslateX = -100 + 100 * openProgress;
  const rightTranslateX = 100 - 100 * openProgress;
  const gap = (isMobile ? 6 : 8) * openProgress;
  const translateY = -(isMobile ? 10 : 15) * openProgress;

  return (
    <section ref={containerRef} className="relative bg-[var(--background)]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="flex h-full w-full items-center justify-center">
          <div
            className="relative flex h-full w-full items-stretch justify-center"
            style={{ gap: `${gap}px` }}
          >
            <div
              className="flex h-full flex-row will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${leftTranslateX}%) translateY(${translateY}%)`,
                opacity: openProgress,
              }}
            >
              {leftSideImages.map((img, idx) => (
                <div
                  key={`L-${img.src}-${idx}`}
                  className="relative h-full overflow-hidden will-change-transform"
                  style={{ flex: 1 }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt || brandName}
                    fill
                    quality={MONO_KINETIC_QUALITY}
                    sizes={MONO_KINETIC_SIZES}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <div
              className="relative overflow-hidden will-change-transform"
              style={{
                width: `${centerWidth}%`,
                height: "100%",
                flex: "0 0 auto",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                style={{
                  opacity: titleOpacity,
                  transform: isMobile ? "translateY(-8%)" : "translateY(-12%)",
                }}
              >
                <h1
                  className={`w-full select-none font-bold leading-[0.85] tracking-tighter text-white mix-blend-difference drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)] ${
                    isMobile
                      ? "px-3 text-left tracking-[-0.055em]"
                      : "px-2 text-center text-[min(12vw,9rem)]"
                  }`}
                >
                  {brandWords.map((word) => (
                    <span
                      key={word}
                      className={`block ${
                        isMobile
                          ? "whitespace-nowrap text-[calc((100vw-1.5rem)/4.15)]"
                          : ""
                      }`}
                    >
                      {word}
                    </span>
                  ))}
                </h1>
              </div>

              <Image
                src={heroImageSrc}
                alt={siteConfig.images?.hero?.alt || brandName}
                fill
                priority
                quality={MONO_KINETIC_QUALITY}
                sizes={MONO_KINETIC_SIZES}
                className="absolute inset-0 z-10 object-cover"
              />
            </div>

            <div
              className="flex h-full flex-row will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${rightTranslateX}%) translateY(${translateY}%)`,
                opacity: openProgress,
              }}
            >
              {rightSideImages.map((img, idx) => (
                <div
                  key={`R-${img.src}-${idx}`}
                  className="relative h-full overflow-hidden will-change-transform"
                  style={{ flex: 1 }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt || brandName}
                    fill
                    quality={MONO_KINETIC_QUALITY}
                    sizes={MONO_KINETIC_SIZES}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Supporting line only on desktop */}
      {!isMobile && subtitle ? (
        <div
          className="pointer-events-none fixed bottom-0 left-0 right-0 z-10 px-8 pb-16 transition-opacity duration-300 lg:px-20 lg:pb-20"
          style={{ opacity: titleOpacity }}
        >
          <p className="mx-auto max-w-2xl text-center text-2xl font-light leading-relaxed text-white drop-shadow-md md:text-3xl lg:text-[2.5rem] lg:leading-snug">
            {subtitle}
          </p>
        </div>
      ) : null}

      <div className="h-[200vh]" />
    </section>
  );
}
