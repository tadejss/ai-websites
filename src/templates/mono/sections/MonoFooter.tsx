import type { SiteConfig } from "@/content/types/site";
import { brandDisplayName, getAddress, getPhoneLabel } from "../../shared/contact-data";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

type Props = {
  siteConfig: SiteConfig;
  siteSlug: string;
};

export function MonoFooter({ siteConfig, siteSlug }: Props) {
  const brandName = brandDisplayName(siteConfig);
  const address = getAddress(siteConfig);
  const phone = getPhoneLabel(siteConfig);

  const exploreLinks = [
    { label: "Prednosti", href: "#prednosti" },
    { label: "Tehnologija", href: "#tehnologija" },
    { label: "Galerija", href: "#galerija" },
    { label: "Modeli", href: "#ponudba" },
  ];

  const infoLinks = [
    { label: "O nas", href: "#o-nas" },
    { label: "Kontakt", href: "#kontakt" },
  ];

  return (
    <footer className="bg-[var(--background)] border-t border-[var(--border)]">
      <div className="px-6 py-16 md:px-12 md:py-20 lg:px-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <a href="#top" className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              {brandName}
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
              {siteConfig.hero.description ||
                "Trajnostno zasnovani objekti, ki združujejo sodobno estetiko, energijsko učinkovitost in naravne materiale."}
            </p>
          </div>

          {/* Explore Links */}
          <div>
            <h4 className="mb-4 text-xs font-semibold tracking-wider uppercase text-[var(--foreground)] font-mono">
              Raziščite
            </h4>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h4 className="mb-4 text-xs font-semibold tracking-wider uppercase text-[var(--foreground)] font-mono">
              Informacije
            </h4>
            <ul className="space-y-3">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact / Service */}
          <div>
            <h4 className="mb-4 text-xs font-semibold tracking-wider uppercase text-[var(--foreground)] font-mono">
              Kontakt
            </h4>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {address || "Slovenija"}
              {phone ? (
                <>
                  <br />
                  {phone}
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer with Legal */}
      <div className="border-t border-[var(--border)] px-6 py-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row text-xs text-[var(--muted)]">
          <p>{siteConfig.footer.rights || `© ${new Date().getFullYear()} ${brandName}. Vse pravice pridržane.`}</p>
          <LegalFooterLinks
            siteSlug={siteSlug}
            siteConfig={siteConfig}
            layout="inline"
            className="text-xs"
            linkClassName="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          />
        </div>
      </div>
    </footer>
  );
}
