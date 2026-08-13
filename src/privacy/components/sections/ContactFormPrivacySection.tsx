import type { ContactFormField, SitePrivacyConfig } from "@/content/types/site";
import { LegalSection } from "../LegalPageLayout";

const FIELD_LABELS: Record<ContactFormField, string> = {
  name: "ime in priimek",
  phone: "telefonska številka",
  message: "sporočilo",
};

type Props = {
  privacy: SitePrivacyConfig;
};

export function ContactFormPrivacySection({ privacy }: Props) {
  if (!privacy.contactForm.enabled) {
    return null;
  }

  const fieldList = privacy.contactForm.fields
    .map((field) => FIELD_LABELS[field])
    .join(", ");

  return (
    <LegalSection title="Kontaktni obrazec">
      <p>
        Na spletni strani je na voljo kontaktni obrazec, prek katerega lahko
        obiskovalec prostovoljno posreduje naslednje podatke: {fieldList}, ter
        morebitne dodatne informacije, ki jih sam vnese v sporočilo.
      </p>
      <p>
        Namen obdelave je obravnava vašega povpraševanja in komunikacija v
        zvezi z vašim sporočilom.
      </p>
      <p>
        Pravna podlaga za obdelavo je zakoniti interes upravljavca za
        obravnavo povpraševanj ter morebitna predpogodbena komunikacija, kadar
        je to ustrezno glede na vsebino sporočila.
      </p>
      <p>
        Podatki iz kontaktnega obrazca se v tej spletni aplikaciji ne shranjujejo
        v bazo podatkov. Sporočilo se posreduje upravljavcu po elektronski pošti
        prek varnega prenosa (SMTP). Za tehnično posredovanje e-pošte se lahko
        uporablja ponudnik storitev elektronske pošte, ki deluje kot
        obdelovalec v okviru naročene storitve.
      </p>
      <p>
        Podatke hranimo le toliko časa, kolikor je potrebno za obravnavo
        povpraševanja in morebitno nadaljnjo komunikacijo, razen če zakon ne
        določa daljšega obdobja hrambe.
      </p>
    </LegalSection>
  );
}
