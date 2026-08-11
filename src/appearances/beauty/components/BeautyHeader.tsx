import { BeautyButton } from "./BeautyButton";
import { Icon } from "@/content/icons";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BeautyHeader({ siteConfig }: Props) {
  const { brand, nav, contact } = siteConfig;

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <a href="#" className="group flex items-center gap-3">
          <span className="font-display flex size-10 items-center justify-center rounded-full border border-accent/15 bg-surface text-lg text-accent">
            {brand.prefix.charAt(0)}
          </span>
          <span className="font-display text-2xl leading-none text-foreground">
            {brand.prefix}
            <span className="italic font-normal"> {brand.highlight}</span>
          </span>
        </a>

        <div className="hidden items-center gap-10 lg:flex">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium tracking-wide text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <BeautyButton href={`#${contact.id}`} variant="chocolate">
            {nav.cta}
          </BeautyButton>
        </div>

        <details className="relative lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground">
            <span>Menu</span>
            <span className="flex size-7 items-center justify-center rounded-full bg-accent-foreground/15">
              <Icon name="menu" />
            </span>
          </summary>

          <div className="absolute right-0 mt-2 w-56 rounded-[var(--radius-card)] border border-border bg-background p-3 shadow-lg">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href={`#${contact.id}`}
              className="mt-2 block rounded-full bg-accent px-4 py-3 text-center text-sm font-medium text-accent-foreground"
            >
              {nav.cta}
            </a>
          </div>
        </details>
      </nav>
    </header>
  );
}
