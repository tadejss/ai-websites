"use client";

import type { ReactNode } from "react";
import { useRef } from "react";

export type MobileNavLink = { href: string; label: string };

type Props = {
  className?: string;
  summary: ReactNode;
  links: MobileNavLink[];
  panelClassName?: string;
  linkClassName?: string;
  cta?: { href: string; label: string; className?: string };
};

export function MobileNavMenu({
  className,
  summary,
  links,
  panelClassName,
  linkClassName,
  cta,
}: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeMenu(): void {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }

  return (
    <details ref={detailsRef} className={className}>
      {summary}
      <div className={panelClassName}>
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={closeMenu}
            className={linkClassName}
          >
            {link.label}
          </a>
        ))}
        {cta ? (
          <a
            href={cta.href}
            onClick={closeMenu}
            className={cta.className}
          >
            {cta.label}
          </a>
        ) : null}
      </div>
    </details>
  );
}
