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
  /** Defaults to muted (not accent — avoids blending into Final CTA). */
  textClassName?: string;
  linkClassName?: string;
  separatorClassName?: string;
  /** Keep legal links in one row (no mobile stack). Default on for all templates. */
  legalLinksInline?: boolean;
};

/** Compact site footer — page-background bar with a clear top rule, width-matched to body. */
export function TemplateFooter({
  siteConfig,
  siteSlug,
  maxWidthClassName = "max-w-5xl",
  contentClassName,
  className = "",
  textClassName = "text-[var(--muted)]",
  linkClassName = "text-[var(--muted)] underline-offset-2 transition-colors hover:text-[var(--foreground)] hover:underline",
  separatorClassName = "text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]",
  legalLinksInline = true,
}: Props) {
  return (
    <footer
      className={`border-t border-[color-mix(in_srgb,var(--foreground)_35%,transparent)] bg-[var(--background)] ${className}`}
    >
      <div
        className={`mx-auto w-full py-5 text-xs sm:py-6 ${textClassName} ${maxWidthClassName} ${
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
