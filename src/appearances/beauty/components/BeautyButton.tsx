import { buttonRadiusClass } from "@/catalog/look-styles";

type Props = {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  variant?: "cream" | "chocolate" | "outline-cream" | "outline-chocolate";
  className?: string;
};

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="size-3.5"
      aria-hidden="true"
    >
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
  cream:
    "bg-accent-foreground text-accent hover:bg-white border border-transparent",
  chocolate:
    "bg-accent text-accent-foreground hover:bg-accent-hover border border-transparent",
  "outline-cream":
    "bg-transparent text-accent-foreground border border-accent-foreground/30 hover:bg-accent-foreground/10",
  "outline-chocolate":
    "bg-transparent text-accent border border-accent/25 hover:bg-accent/5",
} as const;

export function BeautyButton({
  children,
  href,
  type = "button",
  variant = "chocolate",
  className = "",
}: Props) {
  const classes = [
    `inline-flex min-h-12 items-center justify-center gap-3 px-6 text-sm font-medium tracking-wide transition-colors ${buttonRadiusClass()}`,
    variantStyles[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconOnDark = variant === "cream" || variant === "outline-cream";
  const iconDot = (
    <span
      className={`flex size-7 items-center justify-center ${buttonRadiusClass()} ${
        iconOnDark
          ? "bg-accent text-accent-foreground"
          : "bg-accent-foreground/15 text-accent-foreground"
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
