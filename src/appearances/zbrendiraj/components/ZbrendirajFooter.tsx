import Link from "next/link";
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
    <footer className="border-t-2 border-accent bg-black py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-lg text-white">{brandName}</p>
            {footer.tagline ? (
              <p className="mt-1 text-sm text-[#D0D0D0]">{footer.tagline}</p>
            ) : null}
            <p className="mt-4 text-sm text-[#9A9A9A]">
              &copy; {new Date().getFullYear()} {brandName}. {footer.rights}
            </p>
            {footer.managedBy ? (
              <p className="mt-1 text-xs text-[#9A9A9A]">{footer.managedBy}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            <Link
              href={`/${siteSlug}/pogosta-vprasanja`}
              className="text-sm text-[#D0D0D0] transition-colors hover:text-white"
            >
              Pogosta vprašanja
            </Link>
            <LegalFooterLinks siteSlug={siteSlug} siteConfig={siteConfig} />
          </div>
        </div>
      </div>
    </footer>
  );
}
