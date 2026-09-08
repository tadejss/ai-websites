import type { SiteConfig } from "@/content/types/site";
import { brandDisplayName, getPhoneHref } from "./contact-data";
import {
  isAboutVisible,
  isFaqVisible,
  isGalleryVisible,
  isOfferVisible,
} from "./section-data";

type Props = {
  siteConfig: SiteConfig;
  showHeaderPhone?: boolean;
  /** Match the template main column (e.g. max-w-5xl / max-w-6xl). */
  maxWidthClassName?: string;
  /** Center company name on mobile (nav links stay desktop-only). */
  centerBrandOnMobile?: boolean;
  /** Inner row classes (padding, border). Defaults to standard horizontal padding. */
  contentClassName?: string;
  className?: string;
};

export function TemplateTopBar({
  siteConfig,
  showHeaderPhone = false,
  maxWidthClassName = "max-w-5xl",
  centerBrandOnMobile = false,
  contentClassName,
  className = "",
}: Props) {
  const name = brandDisplayName(siteConfig);
  const phoneHref = getPhoneHref(siteConfig);

  const links: Array<{ href: string; label: string }> = [];
  if (isAboutVisible(siteConfig)) {
    links.push({ href: "#o-nas", label: "O nas" });
  }
  if (isOfferVisible(siteConfig)) {
    links.push({ href: "#cenik", label: "Storitve" });
  }
  if (isGalleryVisible(siteConfig)) {
    links.push({ href: "#galerija", label: "Galerija" });
  }
  if (isFaqVisible(siteConfig)) {
    links.push({ href: "#faq", label: "FAQ" });
  }
  links.push({ href: `#${siteConfig.contact.id}`, label: "Kontakt" });

  const hasMobileTrailing = showHeaderPhone && Boolean(phoneHref);

  return (
    <header className={className}>
      <div
        className={`mx-auto flex w-full items-center gap-3 ${maxWidthClassName} ${
          contentClassName ?? "px-4 py-3 sm:px-6"
        } ${
          centerBrandOnMobile && !hasMobileTrailing
            ? "justify-center sm:justify-between"
            : "justify-between"
        }`}
      >
        <a
          href="#top"
          className={`min-w-0 truncate text-sm font-semibold tracking-tight sm:text-base ${
            centerBrandOnMobile ? "text-center sm:text-left" : ""
          }`}
        >
          {name}
        </a>
        <nav
          aria-label="Hitre povezave"
          className={`shrink-0 items-center gap-3 text-sm ${
            centerBrandOnMobile && !hasMobileTrailing
              ? "hidden sm:flex"
              : "flex"
          }`}
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hidden sm:inline hover:opacity-70"
            >
              {link.label}
            </a>
          ))}
          {showHeaderPhone && phoneHref ? (
            <a
              href={phoneHref}
              className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Pokličite
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
