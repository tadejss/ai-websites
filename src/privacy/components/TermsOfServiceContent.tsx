import type { SiteConfig } from "@/content/types/site";
import { LegalSection } from "./LegalPageLayout";

type Props = {
  siteConfig: SiteConfig;
};

export function TermsOfServiceContent({ siteConfig }: Props) {
  const { business, privacy } = siteConfig;
  const operator = business.legalName ?? business.name;

  return (
    <>
      <LegalSection title="1. Splošno">
        <p>
          Ti splošni pogoji urejajo uporabo spletne strani {business.name} in
          storitev izdelave spletnih strani, ki jih ponuja {operator}.
        </p>
        <p>Zadnja posodobitev: {privacy.lastUpdated}.</p>
      </LegalSection>

      <LegalSection title="2. Storitve">
        <p>
          {business.name} ponuja izdelavo in prilagoditev spletnih strani za
          lokalna podjetja. Končna ponudba, obseg del in cena se določita
          posamično glede na potrebe posameznega naročnika.
        </p>
      </LegalSection>

      <LegalSection title="3. Povpraševanje in komunikacija">
        <p>
          Z oddajo kontaktnega obrazca pošljete povpraševanje. Oddaja obrazca
          ne pomeni sklenitve pogodbe. Odgovor posredujemo v razumnem roku na
          kontaktni naslov, ki ga navedete v obrazcu.
        </p>
      </LegalSection>

      <LegalSection title="4. Vsebina in odgovornost">
        <p>
          Trudimo se, da so informacije na tej spletni strani točne in
          ažurne. Pridržujemo si pravico do sprememb vsebine brez predhodnega
          obvestila. Za vsebino, ki jo posreduje naročnik za svojo spletno
          stran, je odgovoren naročnik.
        </p>
      </LegalSection>

      <LegalSection title="5. Pravice intelektualne lastnine">
        <p>
          Oblikovanje, besedila in gradivo te spletne strani so zaščiteni, razen
          če ni drugače navedeno. Brez predhodnega pisnega soglasja jih ni
          dovoljeno kopirati ali uporabljati v komercialne namene.
        </p>
      </LegalSection>

      <LegalSection title="6. Kontakt">
        <p>
          Za vprašanja v zvezi s temi pogoji nas kontaktirajte na{" "}
          <a href={`mailto:${business.email}`} className="underline">
            {business.email}
          </a>
          .
        </p>
      </LegalSection>
    </>
  );
}
