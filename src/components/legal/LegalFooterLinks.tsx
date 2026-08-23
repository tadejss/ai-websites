import Link from "next/link";
import type { SiteConfig } from "@/content/types/site";

type FooterLink = {
  href: string;
  label: string;
};

type Props = {
  siteSlug: string;
  siteConfig?: SiteConfig;
  prependLinks?: FooterLink[];
  linkClassName?: string;
  separatorClassName?: string;
  className?: string;
};

const defaultLinkClassName = "text-muted transition-colors hover:text-foreground";
const defaultSeparatorClassName = "text-muted/50";

export function LegalFooterLinks({
  siteSlug,
  siteConfig,
  prependLinks = [],
  linkClassName = defaultLinkClassName,
  separatorClassName = defaultSeparatorClassName,
  className,
}: Props) {
  const showTerms = siteConfig?.privacy.terms?.enabled === true;

  const legalLinks: FooterLink[] = [
    {
      href: `/${siteSlug}/politika-zasebnosti`,
      label: "Politika zasebnosti",
    },
    { href: `/${siteSlug}/piskotki`, label: "Piškotki" },
  ];

  if (showTerms) {
    legalLinks.push({
      href: `/${siteSlug}/splosni-pogoji`,
      label: "Splošni pogoji",
    });
  }

  const links = [...prependLinks, ...legalLinks];

  return (
    <nav
      aria-label="Pravne informacije"
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${className ?? "justify-center"}`}
    >
      {links.map((link, index) => (
        <span key={link.href} className="inline-flex items-center gap-x-4">
          {index > 0 ? (
            <span className={separatorClassName} aria-hidden="true">
              |
            </span>
          ) : null}
          <Link href={link.href} className={linkClassName}>
            {link.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
