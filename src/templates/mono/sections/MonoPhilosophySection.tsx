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

  const about = getAboutContent(siteConfig);
  const benefits = getBenefitsContent(siteConfig);

  // Dynamic 3D flip titles from benefits or default philosophy statements
  const statements: string[] =
    benefits.items && benefits.items.length >= 3
      ? benefits.items.slice(0, 3).map((item) => item.title)
      : [
          siteConfig.hero.title || "Trajnostna arhitektura.",
          "Zgrajeno za prihodnost.",
          "Eko-odgovorna kakovost.",
        ];

  const philosophyText =
    about.description ||
    siteConfig.hero.description ||
    "Dizajn, ki združuje sodobno estetiko in vrhunsko energijsko učinkovitost. Zgrajeno iz naravnih materialov, ki zmanjšujejo ogljični odtis ter zagotavljajo brezkompromisno udobje bivanja.";

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
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
          Math.max(0, Math.min(1, (thresholdHigh - top) / (thresholdHigh - thresholdLow))),
        );
      }
    }
  }, []);

  useEffect(() => {
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
  }, [handleScroll]);

  const words = philosophyText.split(" ");

  return (
    <section id="prednosti" className="bg-[var(--background)]">
      {/* 3D Cylindrical Flip Titles */}
      <div ref={containerRef} className="relative" style={{ height: "200vh" }}>
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          <div className="relative w-full max-w-7xl px-4">
            <div
              className="flex items-center justify-center pointer-events-none"
              style={{ perspective: "1000px" }}
            >
              <div
                className="relative w-full"
                style={{ transformStyle: "preserve-3d", minHeight: "150px" }}
              >
                {statements.map((statement, idx) => {
                  const isLast = idx === statements.length - 1;
                  const step = 1 / statements.length;
                  const start = idx * step;
                  const end = (idx + 1) * step;

                  let rotateX = 0;
                  let opacity = 0;

                  if (scrollProgress >= start && scrollProgress < end) {
                    const localProg = (scrollProgress - start) / step;
                    rotateX = (1 - localProg) * 90;
                    opacity = localProg;
                  } else if (scrollProgress >= end) {
                    if (isLast) {
                      rotateX = 0;
                      opacity = 1;
                    } else {
                      rotateX = -90;
                      opacity = 0;
                    }
                  } else {
                    rotateX = 90;
                    opacity = 0;
                  }

                  return (
                    <h2
                      key={idx}
                      className="absolute inset-0 flex items-center justify-center text-[7vw] sm:text-[6vw] font-medium leading-tight tracking-tighter text-[var(--foreground)] md:text-[5vw] lg:text-[4vw] text-center px-4"
                      style={{
                        transform: `rotateX(${rotateX}deg) translateZ(0)`,
                        opacity,
                        transformStyle: "preserve-3d",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        willChange: "transform, opacity",
                        WebkitFontSmoothing: "antialiased",
                      }}
                    >
                      {statement}
                    </h2>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kinetic Blur-to-Focus Text */}
      <div
        ref={textRef}
        className="px-6 pt-8 pb-20 md:px-12 md:pt-12 md:pb-28 lg:px-20 lg:pt-16 lg:pb-36"
      >
        <div className="text-center max-w-4xl mx-auto">
          <p className="mt-8 leading-relaxed text-[var(--muted)] text-2xl sm:text-3xl text-center">
            {words.map((word: string, idx: number) => {
              const wordRatio = Math.max(
                0,
                Math.min(1, blurProgress * words.length - idx),
              );
              const blurPx = (1 - wordRatio) * 35;
              return (
                <span
                  key={idx}
                  style={{
                    opacity: wordRatio,
                    filter: `blur(${blurPx}px)`,
                    transition: "opacity 0.3s ease, filter 0.3s ease",
                  }}
                >
                  {word}
                  {idx < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
