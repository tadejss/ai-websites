import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--admin-accent)] text-[var(--admin-accent-foreground)] hover:bg-[var(--admin-accent-hover)]",
        secondary:
          "border border-white/25 bg-transparent text-white hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)]",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        success: "bg-emerald-600 text-white hover:bg-emerald-500",
        ghost:
          "text-[var(--admin-muted)] hover:bg-[var(--admin-surface-elevated)] hover:text-white",
        link: "text-[var(--admin-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-11 min-h-11 shrink-0 px-4 text-xs",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
