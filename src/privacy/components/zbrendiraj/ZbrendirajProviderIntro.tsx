import { LegalSection } from "../LegalPageLayout";

const LAST_UPDATED = "22. 8. 2026";

export function ZbrendirajProviderIntro() {
  return (
    <>
      <p className="text-sm text-muted">
        Zadnja posodobitev: {LAST_UPDATED}
      </p>

      <LegalSection title="Ponudnik">
        <p>
          <strong>DETAJL, oblikovanje, Tadej Šarabon Štojs s.p.</strong>
          <br />
          Langusova ulica 28
          <br />
          4240 Radovljica
          <br />
          Slovenija
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Matična številka: 8665192000</li>
          <li>Davčna številka: SI95610359</li>
          <li>Zavezanec za DDV: da</li>
          <li>
            E-pošta:{" "}
            <a href="mailto:info@zbrendiraj.si" className="text-accent hover:underline">
              info@zbrendiraj.si
            </a>
          </li>
          <li>
            Spletna stran:{" "}
            <a
              href="https://zbrendiraj.si"
              className="text-accent hover:underline"
            >
              https://zbrendiraj.si
            </a>
          </li>
        </ul>
      </LegalSection>
    </>
  );
}
