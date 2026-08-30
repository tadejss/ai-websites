import { BeautyBenefitsSection } from "./components/BeautyBenefitsSection";
import { BeautyContactSection } from "./components/BeautyContactSection";
import { BeautyFooter } from "./components/BeautyFooter";
import { BeautyHeader } from "./components/BeautyHeader";
import { BeautyHeroSection } from "./components/BeautyHeroSection";
import { BeautyServicesSection } from "./components/BeautyServicesSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { PricingSection } from "@/components/sections/PricingSection";
import type { AppearancePageProps } from "../types";

export function BeautySitePage({ siteConfig, siteSlug }: AppearancePageProps) {
  return (
    <>
      <BeautyHeader siteConfig={siteConfig} />
      <main>
        <BeautyHeroSection siteConfig={siteConfig} />
        <BeautyServicesSection siteConfig={siteConfig} />
        <BeautyBenefitsSection siteConfig={siteConfig} />
        <GallerySection siteConfig={siteConfig} headingVariant="beauty" />
        <PricingSection siteConfig={siteConfig} headingVariant="beauty" />
        <BeautyContactSection siteConfig={siteConfig} siteSlug={siteSlug} />
      </main>
      <BeautyFooter siteConfig={siteConfig} siteSlug={siteSlug} />
    </>
  );
}
