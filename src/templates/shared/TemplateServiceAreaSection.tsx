import type { TemplateSectionVariant } from "./TemplateBenefitsSection";

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  variant: TemplateSectionVariant;
};

export function TemplateServiceAreaSection({
  id,
  eyebrow,
  title,
  description,
  variant,
}: Props) {
  if (variant === "outlined") {
    return (
      <section
        id={id}
        className="mt-14 border-2 border-[var(--border)] bg-[var(--surface)] p-6 sm:mt-16 sm:p-8"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">{description}</p>
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
        <p className="mt-3 max-w-2xl text-[var(--muted)]">{description}</p>
      </section>
    );
  }

  if (variant === "floating") {
    return (
      <section
        id={id}
        className="mt-12 rounded-2xl bg-[var(--surface)] p-5 shadow-sm sm:mt-16 sm:p-6"
      >
        <p className="text-sm text-[var(--muted)]">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-3 max-w-prose text-[var(--muted)]">{description}</p>
      </section>
    );
  }

  return (
    <section id={id} className="mt-10">
      <div className="rounded-[var(--radius)] bg-[var(--surface)] p-5 sm:p-7">
        <p className="text-sm text-[var(--muted)]">{eyebrow}</p>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        <p className="mt-3 max-w-prose text-[var(--muted)]">{description}</p>
      </div>
    </section>
  );
}
