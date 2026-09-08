import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
  siteSlug: string;
  /** Match the template main column (e.g. max-w-5xl / max-w-6xl). */
  maxWidthClassName?: string;
  /** Inner bar classes (horizontal padding / extras). Vertical height is fixed. */
  contentClassName?: string;
  className?: string;
  /** Defaults to accent on background. */
  textClassName?: string;
  linkClassName?: string;
  separatorClassName?: string;
  /** Keep legal links in one row (no mobile stack). Default on for all templates. */
  legalLinksInline?: boolean;
};

/** Compact site footer — page-background bar with legal links, width-matched to body. */
export function TemplateFooter({
  siteConfig,
  siteSlug,
  maxWidthClassName = "max-w-5xl",
  contentClassName,
  className = "",
  textClassName = "text-[var(--accent)]",
  linkClassName = "text-[var(--accent)] underline-offset-2 transition-opacity hover:opacity-80 hover:underline",
  separatorClassName = "text-[var(--accent)]/40",
  legalLinksInline = true,
}: Props) {
  return (
    <footer className={className}>
      <div
        className={`mx-auto w-full bg-[var(--background)] py-3 text-xs sm:py-9 ${textClassName} ${maxWidthClassName} ${
          contentClassName ?? "px-4 sm:px-6"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="leading-snug">{siteConfig.footer.rights}</p>
          <LegalFooterLinks
            siteSlug={siteSlug}
            siteConfig={siteConfig}
            layout={legalLinksInline ? "inline" : "stack"}
            className="sm:justify-end"
            linkClassName={linkClassName}
            separatorClassName={separatorClassName}
          />
        </div>
      </div>
    </footer>
  );
}
