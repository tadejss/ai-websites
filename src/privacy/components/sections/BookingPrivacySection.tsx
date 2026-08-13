import type { SitePrivacyConfig } from "@/content/types/site";
import { LegalSection } from "../LegalPageLayout";

type Props = {
  privacy: SitePrivacyConfig;
};

export function BookingPrivacySection({ privacy }: Props) {
  if (!privacy.booking.enabled || privacy.booking.type !== "external_link") {
    return null;
  }

  return (
    <LegalSection title="Zunanji sistem za rezervacije">
      <p>
        Na spletni strani je na voljo povezava do zunanjega ponudnika za
        rezervacije: <strong>{privacy.booking.providerName}</strong>.
      </p>
      <p>
        Ko kliknete povezavo za rezervacijo, zapustite to spletno stran in
        nadaljujete na spletni naslov ponudnika:{" "}
        <a
          href={privacy.booking.url}
          className="text-accent hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {privacy.booking.url}
        </a>
        .
      </p>
      <p>
        Ta spletna stran sama ne obdeluje podatkov, ki jih vnesete v zunanji
        sistem za rezervacije. Obdelavo podatkov v zvezi z rezervacijo ureja
        ponudnik zunanjega sistema.
      </p>
      {privacy.booking.privacyUrl ? (
        <p>
          Politiko zasebnosti ponudnika rezervacij najdete na naslovu:{" "}
          <a
            href={privacy.booking.privacyUrl}
            className="text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {privacy.booking.privacyUrl}
          </a>
          .
        </p>
      ) : null}
    </LegalSection>
  );
}
