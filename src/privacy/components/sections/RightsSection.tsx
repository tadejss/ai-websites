import { LegalSection } from "../LegalPageLayout";

export function RightsSection() {
  return (
    <LegalSection title="Pravice posameznika">
      <p>V zvezi z obdelavo osebnih podatkov imate naslednje pravice:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>pravica do dostopa do svojih osebnih podatkov,</li>
        <li>pravica do popravka netočnih podatkov,</li>
        <li>pravica do izbrisa podatkov,</li>
        <li>pravica do omejitve obdelave,</li>
        <li>pravica do ugovora obdelavi,</li>
        <li>
          pravica do prenosljivosti podatkov, kadar je obdelava avtomatizirana in
          temelji na privolitvi ali pogodbi,
        </li>
        <li>
          pravica do preklica privolitve, kadar obdelava temelji na privolitvi,
          brez vpliva na zakonitost obdelave pred preklicem.
        </li>
      </ul>
      <p>
        Za uveljavljanje pravic nas lahko kontaktirate na zgoraj navedene
        kontaktne podatke upravljavca.
      </p>
      <p>
        Imate tudi pravico vložiti pritožbo pri nadzornem organu:
      </p>
      <address className="not-italic">
        Informacijski pooblaščenec Republike Slovenije
        <br />
        Dunajska cesta 22
        <br />
        1000 Ljubljana
        <br />
        <a href="mailto:gp.ip@ip-rs.si" className="text-accent hover:underline">
          gp.ip@ip-rs.si
        </a>
        <br />
        <a
          href="https://www.ip-rs.si/"
          className="text-accent hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          https://www.ip-rs.si/
        </a>
      </address>
    </LegalSection>
  );
}
