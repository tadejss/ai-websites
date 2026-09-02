import { Icon } from "@/content/icons";
import { MobileNavMenu } from "@/components/ui/MobileNavMenu";
import { formatBrandName } from "@/content/brand-name";
import { ZbrendirajButton } from "./ZbrendirajButton";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
  siteSlug: string;
};

function resolveNavHref(href: string, siteSlug: string): string {
  if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) {
    return href;
  }

  if (href.startsWith("/")) {
    return href;
  }

  return `/${siteSlug}/${href}`;
}

export function ZbrendirajHeader({ siteConfig, siteSlug }: Props) {
  const { brand, nav } = siteConfig;
  const brandName = formatBrandName(brand);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <a href="#" className="font-display text-2xl leading-none text-white">
          {brandName}
        </a>

        <div className="hidden items-center gap-10 lg:flex">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={resolveNavHref(link.href, siteSlug)}
              className="text-sm font-medium tracking-wide text-[#D0D0D0] transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <ZbrendirajButton href="#cenik">{nav.cta}</ZbrendirajButton>
        </div>

        <MobileNavMenu
          className="relative lg:hidden"
          summary={
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-black">
              <span>Menu</span>
              <span className="flex size-7 items-center justify-center rounded-full bg-black/15">
                <Icon name="menu" />
              </span>
            </summary>
          }
          panelClassName="absolute right-0 mt-2 w-56 rounded-[var(--radius-card)] border border-white/15 bg-black p-3 shadow-lg"
          linkClassName="block rounded-xl px-4 py-3 text-sm font-medium text-[#D0D0D0] transition-colors hover:bg-white/5 hover:text-white"
          links={nav.links.map((link) => ({
            href: resolveNavHref(link.href, siteSlug),
            label: link.label,
          }))}
          cta={{
            href: "#cenik",
            label: nav.cta,
            className:
              "mt-2 block rounded-full bg-accent px-4 py-3 text-center text-sm font-semibold text-black",
          }}
        />
      </nav>
    </header>
  );
}
