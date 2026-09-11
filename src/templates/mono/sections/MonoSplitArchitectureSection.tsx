"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoSplitArchitectureSection({}: Props) {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [textProgress, setTextProgress] = useState(0);

  useEffect(() => {
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
          Math.max(0, Math.min(1, (targetPoint - textRect.top) / (targetPoint - 0.1 * windowH))),
        );
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openProgress = Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.8));
  const centerWidth = 100 - 58 * openProgress;
  const sideWidth = 22 * openProgress;
  const leftX = -100 + 100 * openProgress;
  const rightX = 100 - 100 * openProgress;
  const gap = 16 * openProgress;

  // Time-of-day phases
  const centerPhases = [
    { src: "/templates/mono/mono-1.png", alt: "Arhitektura ob sončnem vzhodu", opacity: 1 },
    {
      src: "/templates/mono/mono-2.png",
      alt: "Arhitektura v dnevni svetlobi",
      opacity: Math.max(0, Math.min(1, (scrollProgress - 0.1) / 0.2)),
    },
    {
      src: "/templates/mono/mono-3.png",
      alt: "Arhitektura v mraku",
      opacity: Math.max(0, Math.min(1, (scrollProgress - 0.4) / 0.2)),
    },
    {
      src: "/templates/mono/mono-4.png",
      alt: "Arhitektura ponoči",
      opacity: Math.max(0, Math.min(1, (scrollProgress - 0.7) / 0.2)),
    },
  ];

  const headlinePhrases = [
    "Dizajn & Trajnost.",
    "Pasivna Energija.",
    "Bio-izvorska Gradnja.",
  ];

  const narrativeText =
    "Pasivna arhitektura, ki na novo definira sodobno bivanje. Troslojna zasteklitev, ojačana toplotna izolacija in naravno prezračevanje v kombinaciji s sončnimi celicami ustvarjajo energijsko samozadosten dom. Naravni bio-materiali zagotavljajo zdrav notranji zrak in minimalen ogljični odtis.";

  const narrativeWords = narrativeText.split(" ");

  return (
    <section ref={containerRef} className="relative bg-black text-white">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="flex h-full w-full items-center justify-center">
          <div
            className="relative flex h-full w-full items-stretch justify-center"
            style={{
              gap: `${gap}px`,
              padding: `${16 * openProgress}px`,
            }}
          >
            {/* Left Wing (Interior View) */}
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
                src="/templates/mono/interior-view.png"
                alt="Notranji ambient s panoramskim razgledom"
                fill
                sizes="(max-width: 1024px) 30vw, 22vw"
                className="object-cover"
              />
            </div>

            {/* Center Dynamic Time-of-Day Cross-Fade */}
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
                  key={idx}
                  src={phase.src}
                  alt={phase.alt}
                  fill
                  sizes="100vw"
                  className="absolute inset-0 object-cover"
                  style={{
                    opacity: phase.opacity,
                    transition: "opacity 0.3s ease",
                  }}
                />
              ))}

              <div className="absolute inset-0 bg-black/40" />

              {/* Kinetic Animated Headlines */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                {headlinePhrases.map((phrase, pIdx) => {
                  const step = 1 / headlinePhrases.length;
                  const start = pIdx * step;
                  const end = (pIdx + 1) * step;
                  const words = phrase.split(" ");

                  return (
                    <h2
                      key={pIdx}
                      className="absolute max-w-3xl font-medium leading-tight tracking-tight text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
                    >
                      {words.map((w, wIdx) => {
                        let wordOpacity = 0;
                        let blurPx = 40;

                        if (scrollProgress >= start && scrollProgress < end) {
                          const localProg = (scrollProgress - start) / step;
                          if (localProg < 0.5) {
                            const inProg = Math.max(
                              0,
                              Math.min(1, (localProg / 0.5) * (words.length + 1) - wIdx),
                            );
                            wordOpacity = inProg;
                            blurPx = (1 - inProg) * 40;
                          } else {
                            const outProg = Math.max(
                              0,
                              Math.min(1, ((localProg - 0.5) / 0.5) * (words.length + 1) - wIdx),
                            );
                            wordOpacity = 1 - outProg;
                            blurPx = 40 * outProg;
                          }
                        }

                        return (
                          <span
                            key={wIdx}
                            className="inline-block"
                            style={{
                              opacity: wordOpacity,
                              filter: `blur(${blurPx}px)`,
                              transition: "opacity 0.1s linear, filter 0.1s linear",
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

            {/* Right Wing (Rusted Metal / Material Texture) */}
            <div
              className="relative overflow-hidden will-change-transform"
              style={{
                width: `${sideWidth}%`,
                height: "100%",
                transform: `translateX(${rightX}%)`,
                opacity: openProgress,
              }}
            >
              <Image
                src="/templates/mono/rusted-metal.png"
                alt="Tekstura naravnih materialov"
                fill
                sizes="(max-width: 1024px) 30vw, 22vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-[400vh]" />

      {/* Kinetic Text Banner Below Sticky Section */}
      <div
        ref={textRef}
        className="relative overflow-hidden px-6 py-24 md:px-12 md:py-32 lg:px-20 lg:py-40 bg-black"
      >
        <div
          className="absolute top-0 left-0 right-0 z-0 pointer-events-none"
          style={{
            height: "150px",
            background:
              "linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-2xl font-normal leading-relaxed text-zinc-100 sm:text-3xl md:text-4xl lg:text-5xl">
            {narrativeWords.map((word, wIdx) => {
              const wordScore = Math.max(
                0,
                Math.min(1, textProgress * (narrativeWords.length + 1) - wIdx),
              );
              const blur = (1 - wordScore) * 35;
              return (
                <span
                  key={wIdx}
                  className="inline-block"
                  style={{
                    opacity: wordScore,
                    filter: `blur(${blur}px)`,
                    transition: "opacity 0.1s linear, filter 0.1s linear",
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
    </section>
  );
}
