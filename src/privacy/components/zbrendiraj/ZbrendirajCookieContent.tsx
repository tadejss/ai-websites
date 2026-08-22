import { LegalSection } from "../LegalPageLayout";
import { ZbrendirajProviderIntro } from "./ZbrendirajProviderIntro";

export function ZbrendirajCookieContent() {
  return (
    <>
      <ZbrendirajProviderIntro />

      <LegalSection title="1. Kaj so piškotki">
        <p>
          Piškotki so majhne datoteke, ki se lahko shranijo v uporabnikovo
          napravo ob obisku spletnega mesta. Uporabljajo se lahko za delovanje
          spletnega mesta, shranjevanje nastavitev, varnost, analitiko in druge
          namene.
        </p>
      </LegalSection>

      <LegalSection title="2. Piškotki na Zbrendiraj.si">
        <p>
          Zbrendiraj.si uporablja predvsem tehnično potrebne piškotke oziroma
          podobne tehnologije, ki so potrebne za delovanje spletnega mesta.
          Nenujni analitični, oglaševalski ali drugi sledilni piškotki se ne
          uporabljajo, razen če so na spletnem mestu dejansko aktivirani in je
          za njihovo uporabo pridobljena ustrezna privolitev.
        </p>
        <p>
          Ker se tehnična konfiguracija spletnega mesta lahko spremeni, se lahko
          seznam konkretnih piškotkov spremeni.
        </p>
      </LegalSection>

      <LegalSection title="3. Nujni piškotki">
        <p>
          Nujni piškotki omogočajo osnovno delovanje spletnega mesta, varnost,
          pravilno prikazovanje vsebine, delovanje naročilnega postopka in druge
          funkcionalnosti, brez katerih spletno mesto ne bi delovalo pravilno.
        </p>
        <p>
          Za takšne tehnologije privolitev praviloma ni potrebna, kadar so
          nujno potrebne za storitev, ki jo uporabnik izrecno zahteva.
        </p>
      </LegalSection>

      <LegalSection title="4. Nenujni piškotki">
        <p>
          Če bodo uvedeni analitični, oglaševalski, funkcionalni ali drugi
          nenujni piškotki, bo uporabnik o njih obveščen in bo, kadar je to
          zahtevano, pred njihovo uporabo zaprošen za privolitev. Uporabnik
          lahko svojo privolitev prekliče ali spremeni v nastavitvah piškotkov,
          če je takšna funkcionalnost na spletnem mestu omogočena.
        </p>
      </LegalSection>

      <LegalSection title="5. Piškotki tretjih oseb">
        <p>
          Pri uporabi zunanjih storitev lahko pride do uporabe piškotkov ali
          podobnih tehnologij tretjih oseb. Med zunanjimi ponudniki, katerih
          storitve se lahko uporabljajo pri delovanju Zbrendiraj.si, so Stripe,
          Cloudflare, Vercel, Google in drugi tehnični ponudniki. Konkretna
          uporaba je odvisna od trenutne konfiguracije spletnega mesta in
          posamezne storitve.
        </p>
      </LegalSection>

      <LegalSection title="6. Upravljanje piškotkov">
        <p>
          Uporabnik lahko piškotke upravlja tudi prek nastavitev svojega
          spletnega brskalnika. Blokiranje nujnih piškotkov lahko povzroči, da
          posamezne funkcije spletnega mesta ne bodo delovale pravilno.
        </p>
      </LegalSection>

      <LegalSection title="7. Spremembe politike">
        <p>
          Politiko piškotkov lahko posodobimo zaradi sprememb spletnega mesta,
          uporabljenih storitev ali zakonodaje. Ta politika velja od 22. 8.
          2026.
        </p>
      </LegalSection>
    </>
  );
}
