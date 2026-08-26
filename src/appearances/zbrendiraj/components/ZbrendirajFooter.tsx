import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { formatBrandName } from "@/content/brand-name";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
  siteSlug: string;
};

export function ZbrendirajFooter({ siteConfig, siteSlug }: Props) {
  const { brand, footer } = siteConfig;
  const brandName = formatBrandName(brand);

  return (
    <footer className="border-t-2 border-accent bg-accent py-8 text-black sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 sm:gap-8 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="font-display text-base sm:text-lg">{brandName}</p>
            {footer.tagline ? (
              <p className="mt-1 text-xs text-black/80 sm:text-sm">
                {footer.tagline}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-black/70 sm:mt-4 sm:text-sm">
              &copy; {new Date().getFullYear()} {brandName}. {footer.rights}
            </p>
            {footer.managedBy ? (
              <p className="mt-1 text-[11px] text-black/60 sm:text-xs">
                {footer.managedBy}
              </p>
            ) : null}
          </div>

          <LegalFooterLinks
            siteSlug={siteSlug}
            siteConfig={siteConfig}
            className="md:items-end md:justify-end"
            prependLinks={[
              {
                href: `/${siteSlug}/pogosta-vprasanja`,
                label: "Pogosta vprašanja",
              },
            ]}
            linkClassName="text-black/80 transition-colors hover:text-black"
            separatorClassName="text-black/40"
          />
        </div>
      </div>
    </footer>
  );
}
