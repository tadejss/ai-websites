"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SiteConfig } from "@/content/types/site";
import { brandDisplayName } from "../../shared/contact-data";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoHeroSection({ siteConfig }: Props) {
  const containerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollHeight = 2 * window.innerHeight;
      setScrollProgress(Math.max(0, Math.min(1, -rect.top / scrollHeight)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Kinetic scroll interpolation
  const titleOpacity = Math.max(0, 1 - scrollProgress / 0.2);
  const openProgress = Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.8));

  const centerWidth = 100 - 80 * openProgress;
  const sideWidth = 40 * openProgress;
  const leftTranslateX = -100 + 100 * openProgress;
  const rightTranslateX = 100 - 100 * openProgress;
  const gap = 8 * openProgress;
  const translateY = -(15 * openProgress);

  const brandName = (brandDisplayName(siteConfig) || "MONO").toUpperCase();

  // Images resolution: hero image or fallback to mono assets
  const heroImageSrc = siteConfig.images?.hero?.src || "/templates/mono/hero-mono.png";

  const sideImages = [
    {
      src: "/templates/mono/hero-side-1.png",
      alt: "Arhitekturni ambient 1",
      position: "left" as const,
      span: 1,
    },
    {
      src: "/templates/mono/hero-side-2.png",
      alt: "Arhitekturni ambient 2",
      position: "left" as const,
      span: 1,
    },
    {
      src: "/templates/mono/hero-side-3.png",
      alt: "Arhitekturni ambient 3",
      position: "right" as const,
      span: 1,
    },
    {
      src: "/templates/mono/hero-side-4.png",
      alt: "Arhitekturni ambient 4",
      position: "right" as const,
      span: 1,
    },
  ];

  const leftSideImages = sideImages.filter((img) => img.position === "left");
  const rightSideImages = sideImages.filter((img) => img.position === "right");

  return (
    <section ref={containerRef} className="relative bg-[var(--background)]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="flex h-full w-full items-center justify-center">
          <div
            className="relative flex h-full w-full items-stretch justify-center"
            style={{ gap: `${gap}px` }}
          >
            {/* Left Expanding Panel */}
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
                  key={idx}
                  className="relative h-full overflow-hidden will-change-transform"
                  style={{ flex: img.span, borderRadius: "0px" }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Center Panel with Title and Hero Image */}
            <div
              className="relative overflow-hidden will-change-transform"
              style={{
                width: `${centerWidth}%`,
                height: "100%",
                flex: "0 0 auto",
                borderRadius: "0px",
              }}
            >
              <div
                className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
                style={{
                  opacity: titleOpacity,
                  transform: "translateY(-200px)",
                }}
              >
                <h1 className="whitespace-nowrap text-[35vw] font-bold leading-[0.8] tracking-tighter text-[var(--foreground)] select-none">
                  {brandName.split("").map((char, index) => (
                    <span
                      key={index}
                      className="inline-block"
                      style={{
                        animationDelay: `${0.08 * index}s`,
                        transition: "all 1.5s cubic-bezier(0.86, 0, 0.07, 1)",
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </h1>
              </div>

              <Image
                src={heroImageSrc}
                alt={siteConfig.hero.title || brandName}
                fill
                priority
                sizes="100vw"
                className="absolute inset-0 z-10 object-cover"
              />
            </div>

            {/* Right Expanding Panel */}
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
                  key={idx}
                  className="relative h-full overflow-hidden will-change-transform"
                  style={{ flex: img.span, borderRadius: "0px" }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hero Subtitle Overlay */}
      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-10 px-6 pb-12 md:px-12 md:pb-16 lg:px-20 lg:pb-20 transition-opacity duration-300"
        style={{ opacity: titleOpacity }}
      >
        <p className="mx-auto max-w-2xl text-center text-2xl font-light leading-relaxed text-white drop-shadow-md md:text-3xl lg:text-[2.5rem] lg:leading-snug">
          {siteConfig.hero.description || "Lahkotno, trajnostno in pripravljeno na prihodnost."}
        </p>
      </div>

      <div className="h-[200vh]" />
    </section>
  );
}
