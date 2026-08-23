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
    <footer className="border-t-2 border-accent bg-accent py-12 text-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-lg">{brandName}</p>
            {footer.tagline ? (
              <p className="mt-1 text-sm text-black/80">{footer.tagline}</p>
            ) : null}
            <p className="mt-4 text-sm text-black/70">
              &copy; {new Date().getFullYear()} {brandName}. {footer.rights}
            </p>
            {footer.managedBy ? (
              <p className="mt-1 text-xs text-black/60">{footer.managedBy}</p>
            ) : null}
          </div>

          <LegalFooterLinks
            siteSlug={siteSlug}
            siteConfig={siteConfig}
            className="md:justify-end"
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
