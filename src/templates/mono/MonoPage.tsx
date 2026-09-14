import type { SiteConfig } from "@/content/types/site";
import {
  isAboutVisible,
  isGalleryVisible,
  isOfferVisible,
} from "../shared/section-data";
import { MonoHeader } from "./sections/MonoHeader";
import { MonoHeroSection } from "./sections/MonoHeroSection";
import { MonoPhilosophySection } from "./sections/MonoPhilosophySection";
import { MonoMosaicSection } from "./sections/MonoMosaicSection";
import { MonoOffersSection } from "./sections/MonoOffersSection";
import { MonoSplitArchitectureSection } from "./sections/MonoSplitArchitectureSection";
import { MonoVideoMetricsSection } from "./sections/MonoVideoMetricsSection";
import { MonoTestimonialSection } from "./sections/MonoTestimonialSection";
import { MonoContactSection } from "./sections/MonoContactSection";
import { MonoFooter } from "./sections/MonoFooter";
import { getMonoMediaPool } from "./mono-media";

type Props = {
  siteConfig: SiteConfig;
  siteSlug: string;
};

/**
 * Mono — kinetic reference architecture with SiteConfig-driven salon/beauty content.
 * Mobile-first: stacked hero, compact offers carousel, gated cinematic metrics.
 */
export function MonoPage({ siteConfig, siteSlug }: Props) {
  const hasMedia = getMonoMediaPool(siteConfig).length > 0;
  const showGalleryBlocks = isGalleryVisible(siteConfig) && hasMedia;
  const hasStats = (siteConfig.hero.stats ?? []).some(
    (s) => (s.label || s.title)?.trim() && s.value?.trim(),
  );

  return (
    <div
      id="top"
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--foreground)] selection:text-[var(--background)]"
    >
      <MonoHeader siteConfig={siteConfig} />

      <main>
        <MonoHeroSection siteConfig={siteConfig} />

        {isAboutVisible(siteConfig) || siteConfig.whyChooseUs.benefits?.length ? (
          <MonoPhilosophySection siteConfig={siteConfig} />
        ) : null}

        {/* Delo in ambient */}
        {showGalleryBlocks ? (
          <MonoMosaicSection siteConfig={siteConfig} />
        ) : null}

        {/* Storitve in cene — directly under Delo in ambient */}
        {isOfferVisible(siteConfig) ? (
          <MonoOffersSection siteConfig={siteConfig} />
        ) : null}

        {hasMedia ? (
          <MonoSplitArchitectureSection siteConfig={siteConfig} />
        ) : null}

        {/* Only when metrics exist — never a bare image band above contact */}
        {hasStats ? (
          <MonoVideoMetricsSection siteConfig={siteConfig} />
        ) : null}

        {isAboutVisible(siteConfig) ? (
          <MonoTestimonialSection siteConfig={siteConfig} />
        ) : null}

        <MonoContactSection siteConfig={siteConfig} />
      </main>

      <MonoFooter siteConfig={siteConfig} siteSlug={siteSlug} />
    </div>
  );
}
