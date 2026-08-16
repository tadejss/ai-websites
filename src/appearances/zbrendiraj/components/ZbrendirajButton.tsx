import type { ReactNode } from "react";

type Props = {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  variant?: "primary" | "outline";
  className?: string;
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const variantStyles = {
  primary:
    "bg-accent text-black hover:bg-accent-hover border border-transparent",
  outline:
    "bg-transparent text-white border border-white/25 hover:border-accent hover:text-accent",
} as const;

export function ZbrendirajButton({
  children,
  href,
  type = "button",
  variant = "primary",
  className = "",
}: Props) {
  const classes = [
    "inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 text-sm font-semibold tracking-wide transition-colors",
    variantStyles[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconDot = (
    <span
      className={`flex size-7 items-center justify-center rounded-full ${
        variant === "primary"
          ? "bg-black/20 text-black"
          : "border border-current text-current"
      }`}
    >
      <ArrowIcon />
    </span>
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        <span>{children}</span>
        {iconDot}
      </a>
    );
  }

  return (
    <button type={type} className={classes}>
      <span>{children}</span>
      {iconDot}
    </button>
  );
}
