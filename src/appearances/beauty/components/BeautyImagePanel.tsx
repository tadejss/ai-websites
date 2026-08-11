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
      <div className="absolute inset-0 bg-linear-to-br from-[#e8ddd3] via-[#d9cfc4] to-[#c4b5a8]" />
      <div className="absolute inset-0 bg-linear-to-t from-accent/20 via-transparent to-[#f7f3ee]/30" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 35% 25%, rgba(255,255,255,0.55), transparent 55%), radial-gradient(ellipse 60% 50% at 75% 80%, rgba(61,43,31,0.12), transparent 50%)",
        }}
      />
    </div>
  );
}
