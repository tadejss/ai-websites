import { BeautyBenefitsSection } from "./components/BeautyBenefitsSection";
import { BeautyContactSection } from "./components/BeautyContactSection";
import { BeautyFooter } from "./components/BeautyFooter";
import { BeautyHeader } from "./components/BeautyHeader";
import { BeautyHeroSection } from "./components/BeautyHeroSection";
import { BeautyServicesSection } from "./components/BeautyServicesSection";
import type { AppearancePageProps } from "../types";

export function BeautySitePage({ siteConfig }: AppearancePageProps) {
  return (
    <>
      <BeautyHeader siteConfig={siteConfig} />
      <main>
        <BeautyHeroSection siteConfig={siteConfig} />
        <BeautyServicesSection siteConfig={siteConfig} />
        <BeautyBenefitsSection siteConfig={siteConfig} />
        <BeautyContactSection siteConfig={siteConfig} />
      </main>
      <BeautyFooter siteConfig={siteConfig} />
    </>
  );
}
