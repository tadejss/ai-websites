import type { SitePrivacyConfig } from "@/content/types/site";
import { LegalSection } from "./LegalPageLayout";
import { ZbrendirajCookieContent } from "./zbrendiraj/ZbrendirajCookieContent";

type Props = {
  privacy: SitePrivacyConfig;
  appearance?: string;
};

export function CookiePolicyContent({ privacy, appearance }: Props) {
  if (appearance === "zbrendiraj") {
    return <ZbrendirajCookieContent />;
  }

  const hasNonEssential =
    privacy.analytics.enabled ||
    privacy.marketing.enabled ||
    privacy.cookies.nonEssential ||
    privacy.thirdPartyEmbeds.googleMaps ||
    privacy.thirdPartyEmbeds.youtube;

  return (
    <>
      <p>
        Ta stran pojasnjuje uporabo piškotkov in podobnih tehnologij na tej
        spletni strani.
      </p>

      {hasNonEssential ? (
        <LegalSection title="Neesencialni piškotki">
          <p>
            Na spletni strani so omogočene nekatere neesencialne tehnologije.
            Podrobnosti so navedene v konfiguraciji storitev te spletne strani.
          </p>
        </LegalSection>
      ) : (
        <LegalSection title="Neesencialni piškotki">
          <p>
            Ta spletna stran v privzeti konfiguraciji ne uporablja piškotkov
            ali podobnih tehnologij za analitiko, oglaševanje ali sledenje
            obiskovalcev.
          </p>
        </LegalSection>
      )}

      <LegalSection title="Tehnično nujne tehnologije">
        <p>
          Za osnovno delovanje, varnost in zagotavljanje funkcionalnosti
          spletne strani se lahko uporabljajo tehnično nujne tehnologije, ki so
          potrebne za prikaz vsebine in delovanje strani.
        </p>
        <p>
          V tej različici spletne strani ne navajamo posameznih imen piškotkov,
          trajanja ali ponudnikov, kadar take tehnologije niso dejansko
          implementirane.
        </p>
      </LegalSection>

      <LegalSection title="Spremembe">
        <p>
          Politiko piškotkov lahko občasno posodobimo. Zadnja posodobitev:
          {" "}
          <time dateTime={privacy.lastUpdated}>
            {new Date(privacy.lastUpdated).toLocaleDateString("sl-SI")}
          </time>
          .
        </p>
      </LegalSection>
    </>
  );
}
