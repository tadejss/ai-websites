const variantStyles = {
  primary:
    "inline-flex items-center justify-center rounded-full bg-accent font-semibold text-background transition-colors hover:bg-accent-hover",
  secondary:
    "inline-flex items-center justify-center rounded-full border border-border font-semibold text-foreground transition-colors hover:bg-surface",
} as const;

const sizeStyles = {
  sm: "px-5 py-2.5 text-sm",
  md: "w-full py-3.5 text-sm",
  lg: "px-8 py-3.5 text-base",
} as const;

type Variant = keyof typeof variantStyles;
type Size = keyof typeof sizeStyles;

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & (
  | ({ href: string } & Omit<React.ComponentPropsWithoutRef<"a">, "className">)
  | ({
      href?: undefined;
      type?: "submit" | "button";
    } & Omit<React.ComponentPropsWithoutRef<"button">, "className">)
);

function getButtonClassName(variant: Variant, size: Size, className?: string) {
  return [variantStyles[variant], sizeStyles[size], className]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  size = "sm",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = getButtonClassName(variant, size, className);

  if ("href" in props && props.href) {
    const { href, ...rest } = props;
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  const buttonProps = props as Omit<
    React.ComponentPropsWithoutRef<"button">,
    "className"
  > & { type?: "submit" | "button" };
  const { type = "button", ...rest } = buttonProps;

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
