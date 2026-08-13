import type { SiteConfig } from "@/content/types/site";
import { AutomatedDecisionMakingSection } from "./sections/AutomatedDecisionMakingSection";
import { BookingPrivacySection } from "./sections/BookingPrivacySection";
import { ChangesSection } from "./sections/ChangesSection";
import { ContactFormPrivacySection } from "./sections/ContactFormPrivacySection";
import { ControllerSection } from "./sections/ControllerSection";
import { RightsSection } from "./sections/RightsSection";
import { ThirdPartyServicesSection } from "./sections/ThirdPartyServicesSection";

type Props = {
  siteConfig: SiteConfig;
};

export function PrivacyPolicyContent({ siteConfig }: Props) {
  const { business, privacy } = siteConfig;

  return (
    <>
      <p>
        Ta politika zasebnosti pojasnjuje, kako {business.name} obdeluje osebne
        podatke obiskovalcev te spletne strani.
      </p>

      <ControllerSection business={business} />
      <ContactFormPrivacySection privacy={privacy} />
      <BookingPrivacySection privacy={privacy} />
      <ThirdPartyServicesSection privacy={privacy} />
      <RightsSection />
      <AutomatedDecisionMakingSection />
      <ChangesSection lastUpdated={privacy.lastUpdated} />
    </>
  );
}
