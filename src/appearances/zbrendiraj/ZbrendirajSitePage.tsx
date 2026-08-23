import { ZbrendirajContactSection } from "./components/ZbrendirajContactSection";
import { ZbrendirajConversionSection } from "./components/ZbrendirajConversionSection";
import { ZbrendirajExamplesSection } from "./components/ZbrendirajExamplesSection";
import { ZbrendirajFaqCtaSection } from "./components/ZbrendirajFaqCtaSection";
import { ZbrendirajFooter } from "./components/ZbrendirajFooter";
import { ZbrendirajHeader } from "./components/ZbrendirajHeader";
import { ZbrendirajHeroSection } from "./components/ZbrendirajHeroSection";
import { ZbrendirajPricingSection } from "./components/ZbrendirajPricingSection";
import { ZbrendirajServicesSection } from "./components/ZbrendirajServicesSection";
import { ZbrendirajStepsSection } from "./components/ZbrendirajStepsSection";
import type { AppearancePageProps } from "../types";

export function ZbrendirajSitePage({ siteConfig, siteSlug }: AppearancePageProps) {
  return (
    <>
      <ZbrendirajHeader siteConfig={siteConfig} siteSlug={siteSlug} />
      <main>
        <ZbrendirajHeroSection siteConfig={siteConfig} />
        <ZbrendirajStepsSection siteConfig={siteConfig} />
        <ZbrendirajServicesSection siteConfig={siteConfig} />
        <ZbrendirajExamplesSection siteConfig={siteConfig} />
        <ZbrendirajPricingSection />
        <ZbrendirajFaqCtaSection siteSlug={siteSlug} />
        <ZbrendirajConversionSection siteConfig={siteConfig} />
        <ZbrendirajContactSection siteConfig={siteConfig} siteSlug={siteSlug} />
      </main>
      <ZbrendirajFooter siteConfig={siteConfig} siteSlug={siteSlug} />
    </>
  );
}
