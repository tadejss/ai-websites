"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SiteConfig } from "@/content/types/site";
import { getAboutContent, getBenefitsContent } from "../../shared/section-data";
import { fillMonoMedia, getMonoMediaPool, MONO_KINETIC_QUALITY, MONO_KINETIC_SIZES } from "../mono-media";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoSplitArchitectureSection({ siteConfig }: Props) {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [textProgress, setTextProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const pool = getMonoMediaPool(siteConfig);
  const about = getAboutContent(siteConfig);
  const benefits = getBenefitsContent(siteConfig);

  const phases = fillMonoMedia(pool, 4);
  const leftSrc =
    siteConfig.images?.services?.src || phases[0]?.src || pool[0]?.src;
  const rightSrc = phases[1]?.src || pool[1]?.src || leftSrc;

  const headlinePhrases = (() => {
    if (benefits.items.length >= 3) {
      return benefits.items.slice(0, 3).map((b) =>
        b.title.endsWith(".") ? b.title : `${b.title}.`,
      );
    }
    const highlights = siteConfig.whyChooseUs.highlights?.filter(Boolean) ?? [];
    if (highlights.length >= 3) {
      return highlights.slice(0, 3).map((h) => (h.endsWith(".") ? h : `${h}.`));
    }
    return [
      siteConfig.hero.title,
      siteConfig.hero.titleHighlight,
      siteConfig.hero.badge,
    ]
      .map((s) => s?.trim())
      .filter((s): s is string => Boolean(s))
      .slice(0, 3)
      .map((h) => (h.endsWith(".") ? h : `${h}.`));
  })();

  const narrativeText =
    about.description?.trim() ||
    siteConfig.hero.description?.trim() ||
    "";

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setScrollProgress(1);
      setTextProgress(1);
      return;
    }
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollHeight = 4 * window.innerHeight;
      setScrollProgress(Math.max(0, Math.min(1, -rect.top / scrollHeight)));

      if (textRef.current) {
        const textRect = textRef.current.getBoundingClientRect();
        const windowH = window.innerHeight;
        const targetPoint = 0.9 * windowH;
        setTextProgress(
          Math.max(
            0,
            Math.min(1, (targetPoint - textRect.top) / (targetPoint - 0.1 * windowH)),
          ),
        );
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reduceMotion]);

  if (phases.length === 0 || !leftSrc) {
    return null;
  }

  const openProgress = Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.8));
  const centerWidth = 100 - 58 * openProgress;
  const sideWidth = 22 * openProgress;
  const leftX = -100 + 100 * openProgress;
  const rightX = 100 - 100 * openProgress;
  const gap = 16 * openProgress;

  const centerPhases = phases.map((phase, idx) => ({
    ...phase,
    opacity:
      idx === 0
        ? 1
        : Math.max(0, Math.min(1, (scrollProgress - idx * 0.22) / 0.2)),
  }));

  const narrativeWords = narrativeText.split(" ").filter(Boolean);

  return (
    <section ref={containerRef} className="relative bg-black text-white">
      <div
        className={`${
          reduceMotion ? "relative min-h-[70vh]" : "sticky top-0 h-screen"
        } overflow-hidden`}
      >
        <div className="flex h-full min-h-[70vh] w-full items-center justify-center">
          <div
            className="relative flex h-full w-full items-stretch justify-center"
            style={{
              gap: `${gap}px`,
              padding: `${16 * openProgress}px`,
            }}
          >
            <div
              className="relative overflow-hidden will-change-transform"
              style={{
                width: `${sideWidth}%`,
                height: "100%",
                transform: `translateX(${leftX}%)`,
                opacity: openProgress,
              }}
            >
              <Image
                src={leftSrc}
                alt={siteConfig.images?.services?.alt || "Ambient"}
                fill
                quality={MONO_KINETIC_QUALITY}
                sizes={MONO_KINETIC_SIZES}
                className="object-cover"
              />
            </div>

            <div
              className="relative overflow-hidden will-change-transform rounded-sm"
              style={{
                width: `${centerWidth}%`,
                height: "100%",
                flex: "0 0 auto",
              }}
            >
              {centerPhases.map((phase, idx) => (
                <Image
                  key={`${phase.src}-${idx}`}
                  src={phase.src}
                  alt={phase.alt || ""}
                  fill
                  quality={MONO_KINETIC_QUALITY}
                  sizes={MONO_KINETIC_SIZES}
                  className="absolute inset-0 object-cover"
                  style={{
                    opacity: phase.opacity,
                    transition: "opacity 0.3s ease",
                  }}
                />
              ))}

              <div className="absolute inset-0 bg-black/40" />

              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                {headlinePhrases.map((phrase, pIdx) => {
                  const step = 1 / Math.max(headlinePhrases.length, 1);
                  const start = pIdx * step;
                  const end = (pIdx + 1) * step;
                  const words = phrase.split(" ");

                  return (
                    <h2
                      key={`${phrase}-${pIdx}`}
                      className="absolute max-w-3xl text-4xl font-medium leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
                    >
                      {words.map((w, wIdx) => {
                        let wordOpacity = reduceMotion ? (pIdx === 0 ? 1 : 0) : 0;
                        let blurPx = reduceMotion ? 0 : 40;

                        if (
                          !reduceMotion &&
                          scrollProgress >= start &&
                          scrollProgress < end
                        ) {
                          const localProg = (scrollProgress - start) / step;
                          if (localProg < 0.5) {
                            const inProg = Math.max(
                              0,
                              Math.min(
                                1,
                                (localProg / 0.5) * (words.length + 1) - wIdx,
                              ),
                            );
                            wordOpacity = inProg;
                            blurPx = (1 - inProg) * 40;
                          } else {
                            const outProg = Math.max(
                              0,
                              Math.min(
                                1,
                                ((localProg - 0.5) / 0.5) * (words.length + 1) -
                                  wIdx,
                              ),
                            );
                            wordOpacity = 1 - outProg;
                            blurPx = 40 * outProg;
                          }
                        }

                        return (
                          <span
                            key={`${w}-${wIdx}`}
                            className="inline-block"
                            style={{
                              opacity: wordOpacity,
                              filter: `blur(${blurPx}px)`,
                              marginRight: "0.3em",
                            }}
                          >
                            {w}
                          </span>
                        );
                      })}
                    </h2>
                  );
                })}
              </div>
            </div>

            <div
              className="relative overflow-hidden will-change-transform"
              style={{
                width: `${sideWidth}%`,
                height: "100%",
                transform: `translateX(${rightX}%)`,
                opacity: openProgress,
              }}
            >
              {rightSrc ? (
                <Image
                  src={rightSrc}
                  alt=""
                  fill
                  quality={MONO_KINETIC_QUALITY}
                  sizes={MONO_KINETIC_SIZES}
                  className="object-cover"
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {!reduceMotion ? <div className="h-[400vh]" /> : null}

      {narrativeWords.length > 0 ? (
        <div
          ref={textRef}
          className="relative overflow-hidden bg-black px-6 py-24 md:px-12 md:py-32 lg:px-20 lg:py-40"
        >
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <p className="text-2xl font-normal leading-relaxed text-zinc-100 sm:text-3xl md:text-4xl lg:text-5xl">
              {narrativeWords.map((word, wIdx) => {
                const wordScore = Math.max(
                  0,
                  Math.min(
                    1,
                    (reduceMotion ? 1 : textProgress) *
                      (narrativeWords.length + 1) -
                      wIdx,
                  ),
                );
                const blur = (1 - wordScore) * 35;
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
        </div>
      ) : null}
    </section>
  );
}
