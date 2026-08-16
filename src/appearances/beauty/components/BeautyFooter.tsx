import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { formatBrandName } from "@/content/brand-name";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
  siteSlug: string;
};

export function BeautyFooter({ siteConfig, siteSlug }: Props) {
  const { brand, footer } = siteConfig;
  const brandName = formatBrandName(brand);

  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
          <div className="text-center sm:text-left">
            <p className="font-display text-lg text-foreground">{brandName}</p>
            {footer.tagline ? (
              <p className="mt-1 text-sm text-muted">{footer.tagline}</p>
            ) : null}
            <p className="mt-4 text-sm text-muted">
              &copy; {new Date().getFullYear()} {brandName}. {footer.rights}
            </p>
            {footer.managedBy ? (
              <p className="mt-1 text-xs text-muted/80">{footer.managedBy}</p>
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <LegalFooterLinks siteSlug={siteSlug} siteConfig={siteConfig} />
            <p className="text-center text-sm text-muted sm:text-right">
              {footer.address}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
