import type { SiteConfig } from "@/content/types/site";
import { PhoneCta } from "./PhoneCta";
import type { TemplateSectionVariant } from "./TemplateBenefitsSection";

type Props = {
  id: string;
  title: string;
  description: string;
  siteConfig: SiteConfig;
  variant: TemplateSectionVariant;
};

/** Compact post-contact CTA — phone only, not a second contact block. */
export function TemplateFinalCtaSection({
  id,
  title,
  description,
  siteConfig,
  variant,
}: Props) {
  const shell =
    variant === "outlined"
      ? "mt-14 border-2 border-[var(--accent)] bg-[var(--surface)] p-6 sm:mt-16 sm:p-8"
      : variant === "type"
        ? "mt-12 border-t border-[var(--border)] pt-10 sm:mt-16"
        : variant === "floating"
          ? "mt-12 rounded-2xl bg-[var(--accent)] p-6 text-[var(--accent-foreground)] shadow-sm sm:mt-16"
          : "mt-10 rounded-[var(--radius)] bg-[var(--accent)] p-6 text-[var(--accent-foreground)]";

  const isAccent =
    variant === "bento" || variant === "floating";

  return (
    <section id={id} className={shell}>
      <h2
        className={`text-xl font-bold tracking-tight sm:text-2xl ${
          variant === "type" ? "font-display text-3xl font-extrabold" : ""
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-2 max-w-prose text-sm ${
          isAccent ? "opacity-90" : "text-[var(--muted)]"
        }`}
      >
        {description}
      </p>
      <div className="mt-5">
        <PhoneCta
          siteConfig={siteConfig}
          className={
            isAccent
              ? "!bg-[var(--surface)] !text-[var(--foreground)]"
              : undefined
          }
        />
      </div>
    </section>
  );
}
