import type { BenefitItem } from "./section-data";

export type TemplateSectionVariant = "bento" | "outlined" | "type" | "floating";

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  items: BenefitItem[];
  variant: TemplateSectionVariant;
};

export function TemplateBenefitsSection({
  id,
  eyebrow,
  title,
  description,
  items,
  variant,
}: Props) {
  if (variant === "outlined") {
    return (
      <section id={id} className="mt-14 sm:mt-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-[var(--muted)]">{description}</p>
        ) : null}
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={item.title}
              className="border-2 border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <span className="text-sm font-bold text-[var(--accent)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 font-bold">{item.title}</p>
              {item.description ? (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {item.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (variant === "type") {
    return (
      <section id={id} className="mt-16 sm:mt-20">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-[var(--muted)]">{description}</p>
        ) : null}
        <ul className="mt-8 space-y-4 border-t border-[var(--border)]">
          {items.map((item) => (
            <li
              key={item.title}
              className="border-b border-[var(--border)] py-4"
            >
              <p className="font-bold">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (variant === "floating") {
    return (
      <section id={id} className="mt-12 sm:mt-16">
        <p className="text-sm text-[var(--muted)]">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-prose text-[var(--muted)]">{description}</p>
        ) : null}
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl bg-[var(--surface)] px-4 py-4 shadow-sm"
            >
              <p className="font-semibold">{item.title}</p>
              {item.description ? (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {item.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // bento
  return (
    <section id={id} className="mt-10">
      <div className="rounded-[var(--radius)] bg-[var(--surface)] p-5 sm:p-7">
        <p className="text-sm text-[var(--muted)]">{eyebrow}</p>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-prose text-[var(--muted)]">{description}</p>
        ) : null}
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.title}
              className="rounded-[var(--radius)] bg-[var(--background)] px-4 py-3"
            >
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
