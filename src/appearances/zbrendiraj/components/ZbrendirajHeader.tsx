import { Icon } from "@/content/icons";
import { formatBrandName } from "@/content/brand-name";
import { ZbrendirajButton } from "./ZbrendirajButton";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function ZbrendirajHeader({ siteConfig }: Props) {
  const { brand, nav, contact } = siteConfig;
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
              href={link.href}
              className="text-sm font-medium tracking-wide text-[#D0D0D0] transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <ZbrendirajButton href={`#${contact.id}`}>{nav.cta}</ZbrendirajButton>
        </div>

        <details className="relative lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-black">
            <span>Menu</span>
            <span className="flex size-7 items-center justify-center rounded-full bg-black/15">
              <Icon name="menu" />
            </span>
          </summary>

          <div className="absolute right-0 mt-2 w-56 rounded-[var(--radius-card)] border border-white/15 bg-black p-3 shadow-lg">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-[#D0D0D0] transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <a
              href={`#${contact.id}`}
              className="mt-2 block rounded-full bg-accent px-4 py-3 text-center text-sm font-semibold text-black"
            >
              {nav.cta}
            </a>
          </div>
        </details>
      </nav>
    </header>
  );
}
