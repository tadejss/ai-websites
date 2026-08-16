import Link from "next/link";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteSlug: string;
  siteConfig?: SiteConfig;
};

export function LegalFooterLinks({ siteSlug, siteConfig }: Props) {
  const showTerms = siteConfig?.privacy.terms?.enabled === true;

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
      {showTerms ? (
        <>
          <span className="text-muted/50" aria-hidden="true">
            |
          </span>
          <Link
            href={`/${siteSlug}/splosni-pogoji`}
            className="text-muted transition-colors hover:text-foreground"
          >
            Splošni pogoji
          </Link>
        </>
      ) : null}
    </nav>
  );
}
