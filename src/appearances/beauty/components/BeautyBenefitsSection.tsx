import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BeautyBenefitsSection({ siteConfig }: Props) {
  const { whyChooseUs } = siteConfig;

  return (
    <section
      id={whyChooseUs.id}
      className="bg-background px-4 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              variant="beauty"
              align="left"
              eyebrow={whyChooseUs.eyebrow}
              title={whyChooseUs.title}
              description={whyChooseUs.description}
            />

            <ul className="mt-12 space-y-5">
              {whyChooseUs.highlights.map((item) => (
                <li key={item} className="flex items-start gap-4 text-foreground">
                  <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-accent/15 bg-surface text-accent">
                    <Icon name="check" />
                  </span>
                  <span className="text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {whyChooseUs.benefits.map((benefit) => (
              <article
                key={benefit.label}
                className="rounded-[var(--radius-card)] bg-surface p-7 sm:p-9"
              >
                <p className="font-display text-4xl leading-none text-foreground sm:text-5xl">
                  {benefit.stat}
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {benefit.label}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
