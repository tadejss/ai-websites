import { BeautyButton } from "./BeautyButton";
import { buttonRadiusClass, ICON_RADIUS_CLASS } from "@/catalog/look-styles";
import { MobileNavMenu } from "@/components/ui/MobileNavMenu";
import { Icon } from "@/content/icons";
import { formatBrandName } from "@/content/brand-name";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BeautyHeader({ siteConfig }: Props) {
  const { brand, nav, contact } = siteConfig;
  const brandName = formatBrandName(brand);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <a href="#" className="group flex items-center gap-3">
          {!brand.hideMonogram ? (
            <span className={`font-display flex size-10 items-center justify-center border border-accent/15 bg-surface text-lg text-accent ${ICON_RADIUS_CLASS}`}>
              {brand.prefix.charAt(0)}
            </span>
          ) : null}
          <span className="font-display text-2xl leading-none text-foreground">
            {brand.highlight ? (
              <>
                {brand.prefix}
                <span className="font-normal italic"> {brand.highlight}</span>
              </>
            ) : (
              brandName
            )}
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

        <MobileNavMenu
          className="relative lg:hidden"
          summary={
            <summary className={`flex cursor-pointer list-none items-center gap-2 bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground ${buttonRadiusClass()}`}>
              <span>Menu</span>
              <span className={`flex size-7 items-center justify-center bg-accent-foreground/15 ${ICON_RADIUS_CLASS}`}>
                <Icon name="menu" />
              </span>
            </summary>
          }
        >
          {(closeMenu) => (
            <div className="absolute right-0 mt-2 w-56 rounded-[var(--radius-card)] border border-border bg-background p-3 shadow-lg">
              {nav.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={`#${contact.id}`}
                onClick={closeMenu}
                className={`mt-2 block bg-accent px-4 py-3 text-center text-sm font-medium text-accent-foreground ${buttonRadiusClass()}`}
              >
                {nav.cta}
              </a>
            </div>
          )}
        </MobileNavMenu>
      </nav>
    </header>
  );
}
