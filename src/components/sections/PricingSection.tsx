import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { isPricingSectionVisible } from "@/content/sections";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
  headingVariant?: "default" | "beauty" | "trade";
};

export function PricingSection({
  siteConfig,
  headingVariant = "default",
}: Props) {
  if (!isPricingSectionVisible(siteConfig) || !siteConfig.pricing) {
    return null;
  }

  const { pricing } = siteConfig;

  return (
    <Section id={pricing.id}>
      <SectionHeading
        eyebrow={pricing.eyebrow}
        title={pricing.title}
        description={pricing.description}
        variant={headingVariant}
      />

      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pricing.items.map((item) => (
          <article
            key={`${item.name}-${item.price}`}
            className={
              item.featured
                ? "relative rounded-2xl border-2 border-accent bg-surface-elevated p-6 shadow-sm"
                : "rounded-2xl border border-border bg-surface p-6"
            }
          >
            {item.featured ? (
              <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
                Priporočeno
              </span>
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-foreground">
                {item.name}
              </h3>
              <p className="shrink-0 text-right">
                <span className="text-lg font-bold text-accent">
                  {item.price}
                </span>
                {item.unit ? (
                  <span className="mt-0.5 block text-xs text-muted">
                    {item.unit}
                  </span>
                ) : null}
              </p>
            </div>
            {item.description ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted">
        {pricing.disclaimer}
      </p>
    </Section>
  );
}
