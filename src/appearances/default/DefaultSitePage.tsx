import { BenefitsSection } from "@/components/sections/BenefitsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { Button } from "@/components/ui/Button";
import { MobileNavMenu } from "@/components/ui/MobileNavMenu";
import { Icon } from "@/content/icons";
import type { AppearancePageProps } from "../types";

export function DefaultSitePage({ siteConfig, siteSlug }: AppearancePageProps) {
  const { brand, nav, contact, footer } = siteConfig;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="group flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-background">
              <Icon name="building" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {brand.prefix}{" "}
              <span className="text-accent transition-colors group-hover:text-accent-hover">
                {brand.highlight}
              </span>
            </span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Button href={`#${contact.id}`} size="sm">
              {nav.cta}
            </Button>
          </div>

          <MobileNavMenu
            className="relative md:hidden"
            summary={
              <summary className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-border text-foreground">
                <Icon name="menu" />
              </summary>
            }
          >
            {(closeMenu) => (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-surface-elevated p-2 shadow-xl">
                {nav.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="block rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}

                <a
                  href={`#${contact.id}`}
                  onClick={closeMenu}
                  className="mt-1 block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-background"
                >
                  {nav.cta}
                </a>
              </div>
            )}
          </MobileNavMenu>
        </nav>
      </header>

      <main>
        <HeroSection siteConfig={siteConfig} />
        <ServicesSection siteConfig={siteConfig} />
        <BenefitsSection siteConfig={siteConfig} />
        <GallerySection siteConfig={siteConfig} />
        <PricingSection siteConfig={siteConfig} />
        <ContactSection siteConfig={siteConfig} siteSlug={siteSlug} />
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {brand.prefix} {brand.highlight}.{" "}
            {footer.rights}
          </p>
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <LegalFooterLinks siteSlug={siteSlug} />
            <p>{footer.address}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
