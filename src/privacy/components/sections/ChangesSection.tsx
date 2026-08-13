import { LegalSection } from "../LegalPageLayout";

type Props = {
  lastUpdated: string;
};

export function ChangesSection({ lastUpdated }: Props) {
  return (
    <LegalSection title="Spremembe politike">
      <p>
        To politiko zasebnosti lahko občasno posodobimo. Zadnja posodobitev je
        bila opravljena dne{" "}
        <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>.
      </p>
    </LegalSection>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("sl-SI");
}
