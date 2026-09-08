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
  /** Default stacks on mobile; `inline` keeps policies in one row. */
  layout?: "stack" | "inline";
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
  layout = "stack",
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
  const inline = layout === "inline";

  return (
    <nav
      aria-label="Pravne informacije"
      className={`flex text-xs sm:text-sm ${
        inline
          ? "flex-row flex-wrap items-center gap-x-3 gap-y-1"
          : "flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1"
      } ${className ?? "sm:justify-center"}`}
    >
      {links.map((link, index) => (
        <span key={link.href} className="inline-flex items-center gap-x-3">
          {index > 0 ? (
            <span
              className={`${inline ? "inline" : "hidden sm:inline"} ${separatorClassName}`}
              aria-hidden="true"
            >
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
