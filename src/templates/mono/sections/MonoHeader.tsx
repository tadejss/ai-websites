"use client";

import { useEffect, useState } from "react";
import type { SiteConfig } from "@/content/types/site";
import { brandDisplayName, getPhoneHref } from "../../shared/contact-data";
import {
  isBenefitsVisible,
  isGalleryVisible,
  isOfferVisible,
  isAboutVisible,
} from "../../shared/section-data";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoHeader({ siteConfig }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const brandName = brandDisplayName(siteConfig);
  const phoneHref = getPhoneHref(siteConfig) || "#kontakt";

  const navLinks: Array<{ href: string; label: string }> = [];
  if (isBenefitsVisible(siteConfig)) {
    navLinks.push({ href: "#prednosti", label: "Prednosti" });
  } else {
    navLinks.push({ href: "#tehnologija", label: "Dizajn" });
  }

  if (isGalleryVisible(siteConfig)) {
    navLinks.push({ href: "#galerija", label: "Galerija" });
  }

  if (isOfferVisible(siteConfig)) {
    navLinks.push({ href: "#ponudba", label: "Modeli" });
  }

  if (isAboutVisible(siteConfig)) {
    navLinks.push({ href: "#o-nas", label: "O nas" });
  }

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl transition-all duration-300 ${
        scrolled
          ? "bg-[var(--background)]/80 backdrop-blur-md rounded-full shadow-lg border border-[var(--border)]"
          : "bg-transparent"
      }`}
      style={{
        boxShadow: scrolled
          ? "rgba(0, 0, 0, 0.08) 0px 4px 16px, rgba(0, 0, 0, 0.04) 0px 1px 2px"
          : "none",
      }}
    >
      <div className="flex items-center justify-between transition-all duration-300 px-3 pl-6 py-2.5">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight transition-colors duration-300 text-[var(--foreground)]"
        >
          {brandName}
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={phoneHref}
            className="px-5 py-2 text-sm font-medium transition-all rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-85"
          >
            {siteConfig.hero.primaryCta || "Kontakt"}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 transition-colors md:hidden text-[var(--foreground)]"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-6 py-6 md:hidden rounded-b-2xl shadow-xl">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-medium text-[var(--foreground)] hover:text-[var(--accent)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href={phoneHref}
              className="mt-2 bg-[var(--foreground)] px-5 py-3 text-center text-sm font-medium text-[var(--background)] rounded-full hover:opacity-90"
              onClick={() => setMobileMenuOpen(false)}
            >
              {siteConfig.hero.primaryCta || "Kontakt"}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
