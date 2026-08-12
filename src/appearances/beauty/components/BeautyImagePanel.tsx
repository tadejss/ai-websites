type Props = {
  className?: string;
  label?: string;
};

export function BeautyImagePanel({ className = "", label }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-card)] bg-surface ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      <div className="absolute inset-0 bg-linear-to-br from-surface via-surface-elevated to-accent/25" />
      <div className="absolute inset-0 bg-linear-to-t from-accent/20 via-transparent to-background/30" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 35% 25%, rgba(255,255,255,0.55), transparent 55%), radial-gradient(ellipse 60% 50% at 75% 80%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 50%)",
        }}
      />
    </div>
  );
}
