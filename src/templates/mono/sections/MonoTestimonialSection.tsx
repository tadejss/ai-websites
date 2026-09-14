"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SiteConfig } from "@/content/types/site";
import { brandDisplayName } from "../../shared/contact-data";
import { getMonoMediaPool, MONO_KINETIC_QUALITY, MONO_KINETIC_SIZES } from "../mono-media";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoTestimonialSection({ siteConfig }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [textProgress, setTextProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const brandName = brandDisplayName(siteConfig) || "Atelier";
  const words = brandName.split(/\s+/).filter(Boolean);
  const image =
    getMonoMediaPool(siteConfig)[0] ||
    (siteConfig.images?.hero
      ? {
          src: siteConfig.images.hero.src,
          alt: siteConfig.images.hero.alt || "",
        }
      : null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setTextProgress(1);
      return;
    }
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      const targetPoint = 0.85 * windowH;
      setTextProgress(
        Math.max(
          0,
          Math.min(1, (targetPoint - rect.top) / (targetPoint - 0.15 * windowH)),
        ),
      );
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reduceMotion]);

  if (!image?.src || words.length === 0) {
    return null;
  }

  return (
    <section id="o-nas" ref={sectionRef} className="bg-[var(--background)]">
      <div className="relative aspect-[16/9] min-h-[420px] w-full overflow-hidden">
        <Image
          src={image.src}
          alt={image.alt || brandName}
          fill
          quality={MONO_KINETIC_QUALITY}
          sizes={MONO_KINETIC_SIZES}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <p className="mx-auto max-w-3xl text-center text-xl font-medium tracking-tight text-white drop-shadow-md sm:text-2xl md:text-3xl">
            {words.map((word, wIdx) => {
              const wordScore = Math.max(
                0,
                Math.min(
                  1,
                  (reduceMotion ? 1 : textProgress) * (words.length + 1) - wIdx,
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
                    marginRight: "0.28em",
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
