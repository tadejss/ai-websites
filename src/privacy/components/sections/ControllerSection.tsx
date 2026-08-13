import type { SiteBusinessInfo } from "@/content/types/site";
import { LegalSection } from "../LegalPageLayout";

type Props = {
  business: SiteBusinessInfo;
};

export function ControllerSection({ business }: Props) {
  return (
    <LegalSection title="Upravljavec osebnih podatkov">
      <p>
        Upravljavec osebnih podatkov je <strong>{business.name}</strong>
        {business.legalName && business.legalName !== business.name ? (
          <>
            {" "}
            (pravno ime: <strong>{business.legalName}</strong>)
          </>
        ) : null}
        .
      </p>

      <ul className="list-disc space-y-1 pl-5">
        {business.address ? <li>Naslov: {business.address}</li> : null}
        {business.email ? (
          <li>
            E-pošta:{" "}
            <a href={`mailto:${business.email}`} className="text-accent hover:underline">
              {business.email}
            </a>
          </li>
        ) : null}
        {business.phone ? <li>Telefon: {business.phone}</li> : null}
        {business.registrationNumber ? (
          <li>Matična številka: {business.registrationNumber}</li>
        ) : null}
        {business.vatNumber ? <li>ID za DDV: {business.vatNumber}</li> : null}
      </ul>
    </LegalSection>
  );
}
