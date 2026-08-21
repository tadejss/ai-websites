type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  variant?: "default" | "beauty" | "trade";
  align?: "center" | "left";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  variant = "default",
  align = "center",
}: Props) {
  if (variant === "beauty") {
    return (
      <div
        className={
          align === "center"
            ? "mx-auto max-w-3xl text-center"
            : "max-w-xl text-left"
        }
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted">
          {eyebrow}
        </p>
        <h2 className="font-display mt-5 text-4xl leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
          {title}
          {!title.endsWith(".") && !title.endsWith("!") ? "." : ""}
        </h2>
        {description ? (
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    );
  }

  if (variant === "trade") {
    return (
      <div
        className={
          align === "center"
            ? "mx-auto max-w-2xl text-center"
            : "max-w-xl text-left"
        }
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {eyebrow}
        </p>
        <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 text-lg leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-2xl text-center"
          : "max-w-xl text-left"
      }
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-lg leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  );
}
