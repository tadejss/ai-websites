import type { ReactNode } from "react";

type Variant = "default" | "beauty" | "trade";

type Props = {
  title: string;
  description?: string;
  variant?: Variant;
};

const titleClass: Record<Variant, string> = {
  default: "text-xl font-semibold leading-tight text-foreground sm:text-2xl",
  beauty:
    "font-display text-2xl leading-tight text-foreground sm:text-3xl",
  trade:
    "font-display text-xl font-semibold leading-tight text-foreground sm:text-2xl",
};

const descriptionClass: Record<Variant, string> = {
  default: "mt-2 text-sm leading-relaxed text-muted sm:text-base",
  beauty: "mt-3 text-sm leading-relaxed text-muted sm:text-base",
  trade: "mt-2 text-sm leading-relaxed text-muted sm:text-base",
};

/**
 * Typography-only list row: short title (word or phrase) + one sentence.
 * No card chrome (border, surface, shadow, icons).
 */
export function TextListItem({
  title,
  description,
  variant = "default",
}: Props) {
  return (
    <div>
      <h3 className={titleClass[variant]}>{title}</h3>
      {description ? (
        <p className={descriptionClass[variant]}>{description}</p>
      ) : null}
    </div>
  );
}

type ListProps = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
};

const gapClass: Record<Variant, string> = {
  default: "mt-12 space-y-10",
  beauty: "mt-14 space-y-12",
  trade: "mt-16 space-y-12",
};

export function TextList({
  children,
  className,
  variant = "default",
}: ListProps) {
  return (
    <div className={className ?? gapClass[variant]}>{children}</div>
  );
}
