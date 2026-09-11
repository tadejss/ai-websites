import type { SiteConfig } from "@/content/types/site";
import { MonoHeader } from "./sections/MonoHeader";
import { MonoHeroSection } from "./sections/MonoHeroSection";
import { MonoPhilosophySection } from "./sections/MonoPhilosophySection";
import { MonoMosaicSection } from "./sections/MonoMosaicSection";
import { MonoSplitArchitectureSection } from "./sections/MonoSplitArchitectureSection";
import { MonoStackedGallerySection } from "./sections/MonoStackedGallerySection";
import { MonoOffersSection } from "./sections/MonoOffersSection";
import { MonoVideoMetricsSection } from "./sections/MonoVideoMetricsSection";
import { MonoTestimonialSection } from "./sections/MonoTestimonialSection";
import { MonoContactSection } from "./sections/MonoContactSection";
import { MonoFooter } from "./sections/MonoFooter";

type Props = {
  siteConfig: SiteConfig;
  siteSlug: string;
};

/**
 * Mono Template:
 * High-end architectural minimalism extracted from v0-mono-six.vercel.app.
 * Features:
 * - Floating glass header pill with scroll blur
 * - Kinetic scroll hero with side expanding panels and giant backdrop title
 * - 3D cylindrical flip text + scroll blur-to-focus typography
 * - Asymmetrical 10-item architectural sketch/geometry mosaic
 * - Full-screen kinetic split view with time-of-day cross-fade (morning -> day -> dusk -> night)
 * - 3D stacked card deck gallery with depth translation and zoom ease
 * - Product/surface options carousel and responsive grid
 * - Cinematic video hero with parallax depth and architectural metrics
 * - Large testimonial hero view with gradient scrim
 * - Comprehensive contact section and structured footer
 */
export function MonoPage({ siteConfig, siteSlug }: Props) {
  return (
    <div id="top" className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--foreground)] selection:text-[var(--background)]">
      {/* Floating Header */}
      <MonoHeader siteConfig={siteConfig} />

      <main>
        {/* Kinetic Hero */}
        <MonoHeroSection siteConfig={siteConfig} />

        {/* 3D Cylindrical Flip Philosophy */}
        <MonoPhilosophySection siteConfig={siteConfig} />

        {/* 10-Item Architectural Mosaic */}
        <MonoMosaicSection siteConfig={siteConfig} />

        {/* Kinetic Split Section with Time-of-Day Cross-Fade */}
        <MonoSplitArchitectureSection siteConfig={siteConfig} />

        {/* 3D Stacked Gallery Deck */}
        <MonoStackedGallerySection siteConfig={siteConfig} />

        {/* Models / Surface Options */}
        <MonoOffersSection siteConfig={siteConfig} />

        {/* Video & Performance Metrics */}
        <MonoVideoMetricsSection siteConfig={siteConfig} />

        {/* Full-width Testimonial Architecture Banner */}
        <MonoTestimonialSection siteConfig={siteConfig} />

        {/* Contact Section */}
        <MonoContactSection siteConfig={siteConfig} />
      </main>

      {/* Footer */}
      <MonoFooter siteConfig={siteConfig} siteSlug={siteSlug} />
    </div>
  );
}
