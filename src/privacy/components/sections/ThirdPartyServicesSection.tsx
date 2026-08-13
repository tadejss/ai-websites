import type { SitePrivacyConfig } from "@/content/types/site";
import { LegalSection } from "../LegalPageLayout";

type Props = {
  privacy: SitePrivacyConfig;
};

export function ThirdPartyServicesSection({ privacy }: Props) {
  const services: string[] = [];

  if (privacy.analytics.enabled) {
    services.push(
      privacy.analytics.provider
        ? `analitika (${privacy.analytics.provider})`
        : "analitika",
    );
  }

  if (privacy.marketing.enabled) {
    services.push("marketinška orodja");
  }

  if (privacy.thirdPartyEmbeds.googleMaps) {
    services.push("Google Maps");
  }

  if (privacy.thirdPartyEmbeds.youtube) {
    services.push("YouTube");
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <LegalSection title="Storitve tretjih oseb">
      <p>
        Spletna stran lahko uporablja naslednje storitve tretjih oseb:{" "}
        {services.join(", ")}. Podrobnosti o obdelavi podatkov v zvezi s temi
        storitvami so navedene v tej politiki in/ali v politiki piškotkov.
      </p>
    </LegalSection>
  );
}
