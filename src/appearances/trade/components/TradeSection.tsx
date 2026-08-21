import type { ReactNode } from "react";
import type { LayoutCardStyle, LayoutSectionRule } from "@/content/types/site";

export function tradeCardClass(cardStyle: LayoutCardStyle | undefined): string {
  if (cardStyle === "soft") {
    return "rounded-[var(--radius-card)] bg-surface p-6";
  }

  return "rounded-[var(--radius-card)] border border-border bg-surface p-6";
}

export function TradeSection({
  id,
  sectionRule,
  children,
}: {
  id?: string;
  sectionRule?: LayoutSectionRule;
  children: ReactNode;
}) {
  const ruleClass =
    sectionRule === "none"
      ? "py-20 sm:py-28"
      : "border-t border-border py-20 sm:py-28";

  return (
    <section id={id} className={ruleClass}>
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  );
}
