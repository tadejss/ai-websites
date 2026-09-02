"use client";

import type { ReactNode } from "react";
import { useRef } from "react";

type Props = {
  className?: string;
  summary: ReactNode;
  children: (closeMenu: () => void) => ReactNode;
};

export function MobileNavMenu({ className, summary, children }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeMenu(): void {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }

  return (
    <details ref={detailsRef} className={className}>
      {summary}
      {children(closeMenu)}
    </details>
  );
}
