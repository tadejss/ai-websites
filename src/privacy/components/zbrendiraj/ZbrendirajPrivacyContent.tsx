import { LegalSection } from "../LegalPageLayout";
import { ZbrendirajProviderIntro } from "./ZbrendirajProviderIntro";

export function ZbrendirajPrivacyContent() {
  return (
    <>
      <ZbrendirajProviderIntro />

      <LegalSection title="1. Upravljavec">
        <p>
          Upravljavec osebnih podatkov, ki se obdelujejo prek spletnega mesta
          Zbrendiraj.si, je:
        </p>
        <p>
          <strong>DETAJL, oblikovanje, Tadej Šarabon Štojs s.p.</strong>
          <br />
          Langusova ulica 28
          <br />
          4240 Radovljica
          <br />
          Slovenija
          <br />
          Matična številka: 8665192000
          <br />
          Davčna številka: SI95610359
          <br />
          E-pošta:{" "}
          <a href="mailto:info@zbrendiraj.si" className="text-accent hover:underline">
            info@zbrendiraj.si
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. Namen politike">
        <p>
          Ta Politika zasebnosti pojasnjuje, katere osebne podatke ponudnik
          zbira, za katere namene jih uporablja, s kom jih lahko deli, koliko
          časa jih hrani in katere pravice imajo posamezniki.
        </p>
      </LegalSection>

      <LegalSection title="3. Katere podatke obdelujemo">
        <p>Glede na način uporabe spletnega mesta lahko obdelujemo:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>ime in priimek;</li>
          <li>naziv podjetja;</li>
          <li>e-poštni naslov;</li>
          <li>telefonsko številko;</li>
          <li>naslov in podatke za račun;</li>
          <li>podatke o naročilu in izbranem paketu;</li>
          <li>podatke o plačilu in transakciji;</li>
          <li>komunikacijo z nami;</li>
          <li>podatke, ki jih uporabnik vnese v kontaktni obrazec;</li>
          <li>IP naslov in druge tehnične podatke;</li>
          <li>
            podatke o uporabi spletnega mesta, kadar se za to uporablja
            ustrezna tehnologija in pravna podlaga.
          </li>
        </ul>
        <p>
          Ponudnik ne hrani celotnih podatkov plačilne kartice, če je plačilo
          izvedeno prek Stripe.
        </p>
      </LegalSection>

      <LegalSection title="4. Nameni obdelave">
        <p>Osebne podatke uporabljamo za:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>obravnavo povpraševanj;</li>
          <li>izvedbo naročila;</li>
          <li>vzpostavitev in upravljanje naročnine;</li>
          <li>obdelavo plačil in izdajanje računov;</li>
          <li>komunikacijo z naročnikom;</li>
          <li>zagotavljanje tehničnega delovanja storitve;</li>
          <li>podporo in odpravljanje napak;</li>
          <li>varnost in preprečevanje zlorab;</li>
          <li>izpolnjevanje zakonskih obveznosti;</li>
          <li>uveljavljanje ali varovanje pravnih zahtevkov;</li>
          <li>
            neposredno B2B trženje (vključno s pošiljanjem SMS-ov z demo
            povezavami), kadar je za to zagotovljena ustrezna pravna podlaga.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Pravne podlage">
        <p>Glede na namen obdelave se osebni podatki obdelujejo na podlagi:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>izvedbe pogodbe oziroma ukrepov pred sklenitvijo pogodbe;</li>
          <li>zakonske obveznosti;</li>
          <li>
            zakonitega interesa ponudnika, kadar so izpolnjeni pogoji za njegovo
            uporabo;
          </li>
          <li>privolitve posameznika, kadar je ta potrebna.</li>
        </ul>
        <p>
          Za neposredno B2B trženje – zlasti za pošiljanje SMS-sporočil s
          povezavo do demo spletne strani potencialnim poslovnim strankam –
          se kot pravna podlaga uporablja zakoniti interes ponudnika (člen 6(1)(f)
          GDPR), ob upoštevanju pravil ZEKom-2 o elektronskih komunikacijah za
          poslovne stike. Ponudnik cilja izključno poslovne subjekte (podjetja,
          samostojne podjetnike in druge gospodarske subjekte), katerih kontaktni
          podatki so javno dostopni (npr. prek Google API oziroma drugih javnih
          poslovnih virov) in pri katerih je razvidna potreba po digitalni
          oziroma spletni prisotnosti. Obdelava je omejena na podatke, potrebne
          za takšno kontaktiranje, in se ne uporablja za trženje potrošnikom.
        </p>
        <p>
          Naslovniku je v vsakem trenutku omogočena brezplačna in takojšnja
          odjava od nadaljnjih sporočil (npr. z odgovorom na SMS, prek povezave
          za odjavo ali na{" "}
          <a href="mailto:info@zbrendiraj.si" className="text-accent hover:underline">
            info@zbrendiraj.si
          </a>
          ). Ugovor oziroma odjava se spoštuje brez nepotrebnega odlašanja.
          Posameznik lahko prav tako ugovarja obdelavi, ki temelji na zakonitem
          interesu, skladno s členom 21 GDPR.
        </p>
      </LegalSection>

      <LegalSection title="6. Plačila – Stripe">
        <p>
          Za obdelavo spletnih plačil in naročnin lahko uporabljamo Stripe. Pri
          plačilu se podatki posredujejo Stripe v obsegu, potrebnem za izvedbo
          plačila, preprečevanje goljufij, upravljanje naročnine in izpolnjevanje
          zakonskih obveznosti.
        </p>
        <p>
          Stripe ima lastno politiko zasebnosti in lahko določene podatke
          obdeluje tudi kot samostojen upravljavec. Posameznikom priporočamo, da
          se seznanijo z veljavno politiko zasebnosti družbe Stripe.
        </p>
      </LegalSection>

      <LegalSection title="7. Zunanji ponudniki in obdelovalci">
        <p>
          Za delovanje Zbrendiraj.si in zagotavljanje storitev lahko uporabljamo:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Stripe – plačila in naročnine;</li>
          <li>Vercel – gostovanje in izvajanje spletne infrastrukture;</li>
          <li>GitHub – razvoj, upravljanje kode in repozitorijev;</li>
          <li>Cloudflare – DNS, varnost, CDN in tehnična infrastruktura;</li>
          <li>
            Google – API-storitve, ki se uporabljajo pri posameznih
            funkcionalnostih;
          </li>
          <li>
            Resend – pošiljanje e-pošte in podatkov iz kontaktnih obrazcev;
          </li>
          <li>
            Unsplash – zagotavljanje oziroma licenciranje slikovnega materiala,
            kadar se uporablja pri izdelavi spletnih strani.
          </li>
        </ul>
        <p>Obseg obdelave je odvisen od konkretne uporabe posamezne storitve.</p>
      </LegalSection>

      <LegalSection title="8. Spletne strani naročnikov">
        <p>
          Če Zbrendiraj.si za naročnika zagotavlja kontaktni obrazec ali drugo
          funkcionalnost, pri kateri se zbirajo podatki obiskovalcev naročnikove
          spletne strani, je treba vlogo ponudnika in naročnika določiti glede
          na dejansko obdelavo.
        </p>
        <p>
          Naročnik je praviloma upravljavec osebnih podatkov svojih obiskovalcev,
          Zbrendiraj.si pa lahko nastopa kot obdelovalec oziroma tehnični
          ponudnik. Naročnik je odgovoren za svojo politiko zasebnosti, pravne
          podlage, obvestila uporabnikom in druge obveznosti, ki izhajajo iz
          njegove dejavnosti.
        </p>
      </LegalSection>

      <LegalSection title="9. Piškotki">
        <p>
          Zbrendiraj.si uporablja nujne piškotke in druge tehnologije, ki so
          potrebne za delovanje spletnega mesta. Če bodo uporabljeni analitični,
          oglaševalski ali drugi nenujni piškotki, bodo uporabljeni skladno z
          veljavno zakonodajo in, kadar je potrebno, šele po ustrezni privolitvi
          uporabnika. Podrobnosti so navedene v{" "}
          <a href="/piskotki" className="text-accent hover:underline">
            Politiki piškotkov
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Hramba podatkov">
        <p>
          Osebne podatke hranimo toliko časa, kot je potrebno za namen, za
          katerega so bili zbrani, oziroma toliko časa, kot to zahtevajo veljavni
          predpisi. Podatki o poslovnih transakcijah, računih in drugih
          dokumentih se hranijo v rokih, ki jih določajo davčni, računovodski in
          drugi veljavni predpisi.
        </p>
        <p>
          Po poteku roka hrambe podatke izbrišemo, anonimiziramo ali drugače
          ustrezno odstranimo, razen če obstaja druga pravna podlaga za njihovo
          nadaljnjo hrambo.
        </p>
      </LegalSection>

      <LegalSection title="11. Prenosi podatkov izven EGP">
        <p>
          Posamezni ponudniki lahko osebne podatke obdelujejo tudi zunaj
          Evropskega gospodarskega prostora. Kadar je takšen prenos izveden,
          ponudnik zagotavlja uporabo ustreznega mehanizma prenosa v skladu z
          GDPR, kadar je to potrebno, na primer na podlagi sklepa o ustreznosti,
          standardnih pogodbenih klavzul ali drugega zakonitega mehanizma.
        </p>
      </LegalSection>

      <LegalSection title="12. Varnost">
        <p>
          Ponudnik uporablja razumne tehnične in organizacijske ukrepe za
          zaščito osebnih podatkov pred nepooblaščenim dostopom, izgubo,
          uničenjem, spremembo ali razkritjem. Noben internetni sistem pa ni
          mogoče zagotoviti kot popolnoma varen.
        </p>
      </LegalSection>

      <LegalSection title="13. Pravice posameznika">
        <p>Posameznik ima pod pogoji GDPR pravico do:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>dostopa do svojih osebnih podatkov;</li>
          <li>popravka netočnih podatkov;</li>
          <li>izbrisa;</li>
          <li>omejitve obdelave;</li>
          <li>ugovora obdelavi;</li>
          <li>prenosljivosti podatkov, kadar so izpolnjeni zakonski pogoji;</li>
          <li>
            preklica privolitve, kadar obdelava temelji na privolitvi;
          </li>
          <li>vložitve pritožbe pri pristojnem nadzornem organu.</li>
        </ul>
        <p>
          Zahtevo lahko posameznik pošlje na{" "}
          <a href="mailto:info@zbrendiraj.si" className="text-accent hover:underline">
            info@zbrendiraj.si
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="14. Avtomatizirano odločanje">
        <p>
          Zbrendiraj.si ne izvaja avtomatiziranega odločanja, ki bi za
          posameznika povzročalo pravne učinke ali podobno pomembne učinke,
          razen če bi bil posameznik o tem posebej obveščen in bi za takšno
          obdelavo obstajala ustrezna pravna podlaga.
        </p>
      </LegalSection>

      <LegalSection title="15. Spremembe politike">
        <p>
          Politiko zasebnosti lahko občasno posodobimo zaradi sprememb storitev,
          zakonodaje ali načina obdelave podatkov. Na vrhu dokumenta je naveden
          datum zadnje posodobitve. Ta politika velja od 22. 8. 2026.
        </p>
      </LegalSection>
    </>
  );
}
