import Link from "next/link";

type Props = {
  siteSlug: string;
};

export function LegalFooterLinks({ siteSlug }: Props) {
  return (
    <nav
      aria-label="Pravne informacije"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm"
    >
      <Link
        href={`/${siteSlug}/politika-zasebnosti`}
        className="text-muted transition-colors hover:text-foreground"
      >
        Politika zasebnosti
      </Link>
      <span className="text-muted/50" aria-hidden="true">
        |
      </span>
      <Link
        href={`/${siteSlug}/piskotki`}
        className="text-muted transition-colors hover:text-foreground"
      >
        Piškotki
      </Link>
    </nav>
  );
}
