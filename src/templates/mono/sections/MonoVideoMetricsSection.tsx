"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoVideoMetricsSection({}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [metricProgress, setMetricProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowH = window.innerHeight;
    const top = rect.top;

    if (rect.bottom > 0 && top < windowH) {
      setMetricProgress(
        Math.max(0, Math.min(1, 1 - (top + rect.height / 2) / (windowH + rect.height))),
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

  const translateY = (metricProgress - 0.5) * 30;

  // Custom metrics or architecture defaults
  const metrics = [
    { label: "Bivalna površina", value: "180 m²" },
    { label: "Raba energije", value: "15 kWh/m²" },
    { label: "Sončna elektrarna", value: "40 m²" },
    { label: "Ogljični odtis", value: "-20%" },
  ];

  return (
    <section className="bg-[var(--background)]">
      {/* Video Container with Parallax Zoom */}
      <div
        ref={containerRef}
        className="relative aspect-[16/9] w-full md:aspect-[21/9] overflow-hidden bg-black"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            transform: `scale(1.15) translate3d(0, ${translateY}px, 0) translateZ(0)`,
            WebkitTransform: `scale(1.15) translate3d(0, ${translateY}px, 0) translateZ(0)`,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            willChange: "transform",
          }}
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/27eb7fb4-0105-4010-ac9e-0ac977a31b05_1-FZ89nvBAAsR3caRJbhYv7T2mjBofth.mp4"
        />
      </div>

      {/* 4-Column Architectural Performance Metrics */}
      <div className="grid grid-cols-2 border-t border-[var(--border)] md:grid-cols-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="border-b border-r border-[var(--border)] p-8 text-center last:border-r-0 md:border-b-0"
          >
            <p className="mb-2 text-xs uppercase tracking-widest text-[var(--muted)] font-mono">
              {metric.label}
            </p>
            <p className="font-medium text-[var(--foreground)] text-4xl sm:text-5xl">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
