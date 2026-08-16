import { ZbrendirajContactSection } from "./components/ZbrendirajContactSection";
import { ZbrendirajConversionSection } from "./components/ZbrendirajConversionSection";
import { ZbrendirajExamplesSection } from "./components/ZbrendirajExamplesSection";
import { ZbrendirajFooter } from "./components/ZbrendirajFooter";
import { ZbrendirajHeader } from "./components/ZbrendirajHeader";
import { ZbrendirajHeroSection } from "./components/ZbrendirajHeroSection";
import { ZbrendirajServicesSection } from "./components/ZbrendirajServicesSection";
import type { AppearancePageProps } from "../types";

export function ZbrendirajSitePage({ siteConfig, siteSlug }: AppearancePageProps) {
  return (
    <>
      <ZbrendirajHeader siteConfig={siteConfig} />
      <main>
        <ZbrendirajHeroSection siteConfig={siteConfig} />
        <ZbrendirajServicesSection siteConfig={siteConfig} />
        <ZbrendirajExamplesSection siteConfig={siteConfig} />
        <ZbrendirajConversionSection siteConfig={siteConfig} />
        <ZbrendirajContactSection siteConfig={siteConfig} siteSlug={siteSlug} />
      </main>
      <ZbrendirajFooter siteConfig={siteConfig} siteSlug={siteSlug} />
    </>
  );
}
