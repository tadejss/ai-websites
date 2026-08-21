import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TradeSection, tradeCardClass } from "./TradeSection";
import { resolveTradeLayoutFromConfig } from "./trade-layout";
import type { IconName, SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

const BENEFIT_ICONS: IconName[] = [
  "service-1",
  "service-2",
  "service-3",
  "service-4",
  "service-5",
  "service-6",
];

export function TradeBenefitsSection({ siteConfig }: Props) {
  const { whyChooseUs } = siteConfig;
  const layout = resolveTradeLayoutFromConfig(siteConfig);
  const cardClass = tradeCardClass(layout.cardStyle);

  if (layout.benefitsMode === "visual") {
    return (
      <TradeSection id={whyChooseUs.id} sectionRule={layout.sectionRule}>
        <SectionHeading
          variant="trade"
          eyebrow={whyChooseUs.eyebrow}
          title={whyChooseUs.title}
          description={whyChooseUs.description}
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.benefits.map((benefit, index) => (
            <article
              key={benefit.title ?? benefit.label}
              className={cardClass}
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon name={BENEFIT_ICONS[index % BENEFIT_ICONS.length]} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted">
                {benefit.label}
              </p>
              {(benefit.title || benefit.stat) ? (
                <p className="font-display mt-1 text-xl font-semibold text-foreground">
                  {benefit.title ?? benefit.stat}
                </p>
              ) : null}
              {benefit.description ? (
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {benefit.description}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </TradeSection>
    );
  }

  return (
    <TradeSection id={whyChooseUs.id} sectionRule={layout.sectionRule}>
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <div>
          <SectionHeading
            variant="trade"
            align="left"
            eyebrow={whyChooseUs.eyebrow}
            title={whyChooseUs.title}
            description={whyChooseUs.description}
          />

          <ul className="mt-10 space-y-4">
            {whyChooseUs.highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Icon name="check" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-6">
          {whyChooseUs.benefits.map((benefit) => (
            <article
              key={benefit.label}
              className={
                layout.cardStyle === "soft"
                  ? "rounded-[var(--radius-card)] bg-surface-elevated p-8"
                  : "rounded-[var(--radius-card)] border border-border bg-surface-elevated p-8"
              }
            >
              <p className="font-display text-4xl font-semibold text-accent">
                {benefit.stat}
              </p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-foreground">
                {benefit.label}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </TradeSection>
  );
}
