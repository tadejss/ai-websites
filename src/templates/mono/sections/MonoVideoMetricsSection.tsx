"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SiteConfig } from "@/content/types/site";
import { getMonoMediaPool, MONO_KINETIC_QUALITY, MONO_KINETIC_SIZES } from "../mono-media";

type Props = {
  siteConfig: SiteConfig;
};

/** Cinematic media band + optional hero.stats strip (Mono DNA without remote video). */
export function MonoVideoMetricsSection({ siteConfig }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [metricProgress, setMetricProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const bandImage =
    siteConfig.images?.services?.src ||
    getMonoMediaPool(siteConfig)[0]?.src ||
    siteConfig.images?.hero?.src;

  const metrics = (siteConfig.hero.stats ?? [])
    .map((stat) => ({
      label: (stat.label || stat.title || "").trim(),
      value: (stat.value || "").trim(),
    }))
    .filter((m) => m.label && m.value)
    .slice(0, 4);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowH = window.innerHeight;
    const top = rect.top;

    if (rect.bottom > 0 && top < windowH) {
      setMetricProgress(
        Math.max(
          0,
          Math.min(1, 1 - (top + rect.height / 2) / (windowH + rect.height)),
        ),
      );
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

  if (metrics.length === 0) {
    return null;
  }

  const translateY = (metricProgress - 0.5) * 30;

  return (
    <section className="bg-[var(--background)]">
      {bandImage ? (
        <div
          ref={containerRef}
          className="relative aspect-[16/9] w-full overflow-hidden bg-black md:aspect-[21/9]"
        >
          <Image
            src={bandImage}
            alt={siteConfig.images?.services?.alt || ""}
            fill
            quality={MONO_KINETIC_QUALITY}
            sizes={MONO_KINETIC_SIZES}
            className="object-cover"
            style={{
              transform: `scale(1.15) translate3d(0, ${translateY}px, 0)`,
              willChange: "transform",
            }}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 border-t border-[var(--border)] md:grid-cols-4">
        {metrics.map((metric, idx) => (
          <div
            key={`${metric.label}-${idx}`}
            className="border-b border-r border-[var(--border)] p-8 text-center last:border-r-0 md:border-b-0"
          >
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
              {metric.label}
            </p>
            <p className="text-4xl font-medium text-[var(--foreground)] sm:text-5xl">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
