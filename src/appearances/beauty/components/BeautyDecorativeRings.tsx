type Props = {
  className?: string;
  variant?: "hero" | "section";
};

export function BeautyDecorativeRings({ className = "" }: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute -right-16 -top-16 size-64 rounded-full border border-accent-foreground/10" />
      <div className="absolute -right-8 -top-8 size-48 rounded-full border border-accent-foreground/15" />
      <div className="absolute right-8 top-8 size-32 rounded-full border border-accent-foreground/20" />
    </div>
  );
}
