import type { ProcessStepItem } from "./section-data";
import type { TemplateSectionVariant } from "./TemplateBenefitsSection";

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  steps: ProcessStepItem[];
  variant: TemplateSectionVariant;
};

function StepMarker({
  index,
  variant,
}: {
  index: number;
  variant: TemplateSectionVariant;
}) {
  const n = String(index + 1).padStart(2, "0");

  if (variant === "outlined") {
    return (
      <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[var(--accent)] bg-[var(--surface)] text-xs font-bold text-[var(--accent)]">
        {n}
      </span>
    );
  }

  if (variant === "type") {
    return (
      <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--accent-foreground)]">
        {n}
      </span>
    );
  }

  if (variant === "floating") {
    return (
      <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--accent-foreground)] shadow-sm">
        {index + 1}
      </span>
    );
  }

  return (
    <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--accent-foreground)]">
      {n}
    </span>
  );
}

/**
 * Process as a timeline: vertical rail on mobile; horizontal connected steps on desktop
 * (type stays vertical — matches its typographic rhythm).
 */
export function TemplateProcessSection({
  id,
  eyebrow,
  title,
  description,
  steps,
  variant,
}: Props) {
  const header =
    variant === "outlined" ? (
      <>
        <p className="text-xs font-bold uppercase tracking-[0.2em]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">{title}</h2>
      </>
    ) : variant === "type" ? (
      <>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          {title}
        </h2>
      </>
    ) : (
      <>
        <p className="text-sm text-[var(--muted)]">{eyebrow}</p>
        <h2
          className={
            variant === "bento"
              ? "text-xl font-bold tracking-tight sm:text-2xl"
              : "mt-1 text-2xl font-bold tracking-tight"
          }
        >
          {title}
        </h2>
      </>
    );

  const sectionClass =
    variant === "outlined"
      ? "mt-14 sm:mt-16"
      : variant === "type"
        ? "mt-16 sm:mt-20"
        : variant === "floating"
          ? "mt-12 sm:mt-16"
          : "mt-10";

  const body = (
    <>
      {header}
      {description ? (
        <p className="mt-3 max-w-2xl text-[var(--muted)]">{description}</p>
      ) : null}

      {/* Mobile / type: vertical timeline */}
      <ol
        className={`relative mt-8 space-y-0 ${
          variant === "type" ? "" : "sm:hidden"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-2 bottom-2 left-[17px] w-px ${
            variant === "outlined"
              ? "bg-[var(--border)]"
              : "bg-[color-mix(in_srgb,var(--accent)_35%,var(--border))]"
          }`}
        />
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
            <StepMarker index={index} variant={variant} />
            <div className="min-w-0 pt-1">
              <p className="font-bold">{step.title}</p>
              {step.description ? (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {step.description}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {/* Desktop: horizontal timeline (not type) */}
      {variant !== "type" ? (
        <ol
          className="relative mt-10 hidden sm:grid sm:gap-6"
          style={{
            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
          }}
        >
          <span
            aria-hidden
            className={`absolute top-[18px] h-px ${
              variant === "outlined"
                ? "bg-[var(--border)]"
                : "bg-[color-mix(in_srgb,var(--accent)_40%,var(--border))]"
            }`}
            style={{
              left: `calc(100% / ${steps.length * 2})`,
              right: `calc(100% / ${steps.length * 2})`,
            }}
          />
          {steps.map((step, index) => (
            <li key={step.title} className="relative flex flex-col items-start">
              <StepMarker index={index} variant={variant} />
              <div
                className={
                  variant === "outlined"
                    ? "mt-4 w-full border-2 border-[var(--border)] bg-[var(--surface)] p-4"
                    : variant === "floating"
                      ? "mt-4 w-full rounded-2xl bg-[var(--surface)] p-4 shadow-sm"
                      : "mt-4 w-full rounded-[var(--radius)] bg-[var(--background)] p-4"
                }
              >
                <p className="font-bold leading-snug">{step.title}</p>
                {step.description ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {step.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );

  if (variant === "bento") {
    return (
      <section id={id} className={sectionClass}>
        <div className="rounded-[var(--radius)] bg-[var(--surface)] p-5 sm:p-7">
          {body}
        </div>
      </section>
    );
  }

  return (
    <section id={id} className={sectionClass}>
      {body}
    </section>
  );
}
