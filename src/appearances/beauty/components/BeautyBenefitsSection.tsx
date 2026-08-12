import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatCardTitle } from "../utils/format-card-title";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BeautyBenefitsSection({ siteConfig }: Props) {
  const { whyChooseUs } = siteConfig;

  return (
    <section
      id={whyChooseUs.id}
      className="bg-background px-4 py-24 sm:px-6 sm:py-32"
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
                key={formatCardTitle(benefit)}
                className="rounded-[var(--radius-card)] bg-accent p-7 text-accent-foreground sm:p-9"
              >
                <p className="font-display text-3xl leading-tight sm:text-4xl">
                  {formatCardTitle(benefit)}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-accent-foreground/75 sm:text-base">
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
