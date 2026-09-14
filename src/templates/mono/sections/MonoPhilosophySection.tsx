"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteConfig } from "@/content/types/site";
import { getAboutContent, getBenefitsContent } from "../../shared/section-data";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoPhilosophySection({ siteConfig }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [blurProgress, setBlurProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const about = getAboutContent(siteConfig);
  const benefits = getBenefitsContent(siteConfig);

  const statements: string[] = (() => {
    if (benefits.items.length >= 3) {
      return benefits.items.slice(0, 3).map((item) => item.title);
    }
    const highlights = siteConfig.whyChooseUs.highlights?.filter(Boolean) ?? [];
    if (highlights.length >= 3) {
      return highlights.slice(0, 3);
    }
    const titleLine = [siteConfig.hero.title, siteConfig.hero.titleHighlight]
      .filter(Boolean)
      .join(" ")
      .trim();
    return [about.title, titleLine, siteConfig.hero.badge]
      .map((s) => s?.trim())
      .filter((s): s is string => Boolean(s))
      .slice(0, 3);
  })();

  const philosophyText =
    about.description?.trim() ||
    siteConfig.hero.description?.trim() ||
    "";

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || reduceMotion) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowH = window.innerHeight;
    const totalH = containerRef.current.offsetHeight;

    setScrollProgress(Math.max(0, Math.min(1, -rect.top / (totalH - windowH))));

    if (textRef.current) {
      const textRect = textRef.current.getBoundingClientRect();
      const top = textRect.top;
      const height = textRect.height;
      const thresholdHigh = 0.8 * windowH;
      const thresholdLow = 0.2 * windowH;

      if (top < thresholdHigh && top > thresholdLow - height) {
        setBlurProgress(
          Math.max(
            0,
            Math.min(1, (thresholdHigh - top) / (thresholdHigh - thresholdLow)),
          ),
        );
      }
    }
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      setScrollProgress(1);
      setBlurProgress(1);
      return;
    }
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
  }, [handleScroll, reduceMotion]);

  if (statements.length === 0 && !philosophyText) {
    return null;
  }

  const words = philosophyText.split(" ").filter(Boolean);
  const progress = reduceMotion ? 1 : scrollProgress;

  return (
    <section id="prednosti" className="bg-[var(--background)]">
      {statements.length > 0 ? (
        <div
          ref={containerRef}
          className="relative"
          style={{ height: reduceMotion ? "auto" : "200vh" }}
        >
          <div
            className={`${
              reduceMotion ? "relative py-24" : "sticky top-0 h-screen"
            } flex items-center justify-center overflow-hidden`}
          >
            <div
              className="relative w-full max-w-5xl px-6"
              style={{ perspective: "1000px" }}
            >
              {statements.map((statement, idx) => {
                const segment = 1 / statements.length;
                const local = Math.max(
                  0,
                  Math.min(1, (progress - idx * segment) / segment),
                );
                const rotateX = reduceMotion
                  ? 0
                  : local < 0.5
                    ? 90 - local * 180
                    : -90 + (1 - local) * 180;
                const opacity = reduceMotion
                  ? 1
                  : local < 0.15
                    ? local / 0.15
                    : local > 0.85
                      ? (1 - local) / 0.15
                      : 1;

                return (
                  <h2
                    key={`${statement}-${idx}`}
                    className="absolute inset-x-6 text-center text-4xl font-medium tracking-tight text-[var(--foreground)] sm:text-5xl md:text-6xl lg:text-7xl"
                    style={{
                      opacity: reduceMotion ? (idx === 0 ? 1 : 0.35) : opacity,
                      transform: `rotateX(${rotateX}deg)`,
                      transformStyle: "preserve-3d",
                      position: reduceMotion ? "relative" : "absolute",
                      marginBottom: reduceMotion ? "1.5rem" : undefined,
                    }}
                  >
                    {statement}
                  </h2>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {words.length > 0 ? (
        <div ref={textRef} className="px-6 py-24 md:px-12 md:py-32 lg:px-20">
          <p className="mx-auto max-w-4xl text-center text-2xl font-light leading-relaxed text-[var(--foreground)] sm:text-3xl md:text-4xl">
            {words.map((word, wIdx) => {
              const wordScore = Math.max(
                0,
                Math.min(
                  1,
                  (reduceMotion ? 1 : blurProgress) * (words.length + 1) - wIdx,
                ),
              );
              const blur = (1 - wordScore) * 28;
              return (
                <span
                  key={`${word}-${wIdx}`}
                  className="inline-block"
                  style={{
                    opacity: wordScore,
                    filter: reduceMotion ? undefined : `blur(${blur}px)`,
                    marginRight: "0.3em",
                  }}
                >
                  {word}
                </span>
              );
            })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
