"use client";

import { useEffect, useState } from "react";
import type { SiteConfig } from "@/content/types/site";
import { brandDisplayName, getPhoneHref } from "../../shared/contact-data";
import {
  getOfferSectionMeta,
  isAboutVisible,
  isBenefitsVisible,
  isGalleryVisible,
  isOfferVisible,
} from "../../shared/section-data";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoHeader({ siteConfig }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const brandName = brandDisplayName(siteConfig);
  const phoneHref = getPhoneHref(siteConfig) || "#kontakt";

  const fromConfig = siteConfig.nav.links?.filter(
    (l) => l.href?.trim() && l.label?.trim(),
  );
  const navLinks: Array<{ href: string; label: string }> =
    fromConfig && fromConfig.length > 0
      ? fromConfig.map((l) => ({ href: l.href, label: l.label }))
      : (() => {
          const links: Array<{ href: string; label: string }> = [];
          if (isBenefitsVisible(siteConfig)) {
            links.push({ href: "#prednosti", label: "Prednosti" });
          }
          if (isGalleryVisible(siteConfig)) {
            links.push({ href: "#tehnologija", label: "Ambient" });
          }
          if (isOfferVisible(siteConfig)) {
            links.push({
              href: `#${getOfferSectionMeta(siteConfig).id || "ponudba"}`,
              label: "Storitve",
            });
          }
          if (isAboutVisible(siteConfig)) {
            links.push({ href: "#o-nas", label: "O nas" });
          }
          links.push({
            href: `#${siteConfig.contact.id || "kontakt"}`,
            label: "Kontakt",
          });
          return links;
        })();

  const shellActive = scrolled || mobileMenuOpen;

  return (
    <header
      className={`fixed left-1/2 top-3 z-50 w-[min(92%,42rem)] -translate-x-1/2 rounded-[1.875rem] transition-[background-color,box-shadow,border-color] duration-300 md:top-4 ${
        shellActive
          ? "border border-[var(--border)] bg-[var(--background)]/95 shadow-lg backdrop-blur-md"
          : "border border-transparent bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
        <a
          href="#top"
          className="min-w-0 truncate text-base font-bold tracking-tight text-[var(--foreground)] sm:text-lg"
          onClick={() => setMobileMenuOpen(false)}
        >
          {brandName}
        </a>

        <nav className="hidden items-center gap-6 md:flex lg:gap-8">
          {navLinks.slice(0, 5).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={phoneHref}
            className="rounded-full bg-[var(--foreground)] px-5 py-2 text-sm font-medium text-[var(--background)] transition-all hover:opacity-85"
          >
            {siteConfig.hero.primaryCta || siteConfig.nav.cta || "Kontakt"}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--foreground)_18%,transparent)] text-[var(--foreground)] md:hidden"
          aria-expanded={mobileMenuOpen}
          aria-controls="mono-mobile-menu"
          aria-label={mobileMenuOpen ? "Zapri meni" : "Odpri meni"}
        >
          {mobileMenuOpen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <div
        id="mono-mobile-menu"
        className={`grid transition-[grid-template-rows] duration-300 ease-out md:hidden ${
          mobileMenuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="overflow-hidden">
          <nav className="border-t border-[var(--border)] px-4 pb-4 pt-1 sm:px-5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] py-3 text-[0.95rem] font-medium text-[var(--foreground)] last:border-b-0"
                onClick={() => setMobileMenuOpen(false)}
                tabIndex={mobileMenuOpen ? 0 : -1}
              >
                {link.label}
              </a>
            ))}
            <a
              href={phoneHref}
              className="mt-3 flex min-h-11 items-center justify-center rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)]"
              onClick={() => setMobileMenuOpen(false)}
              tabIndex={mobileMenuOpen ? 0 : -1}
            >
              {siteConfig.hero.primaryCta || siteConfig.nav.cta || "Kontakt"}
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
