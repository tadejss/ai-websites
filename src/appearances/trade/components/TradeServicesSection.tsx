import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TradeImage } from "./TradeImage";
import { TradeSection, tradeCardClass } from "./TradeSection";
import { resolveTradeLayoutFromConfig } from "./trade-layout";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

function ServiceCards({
  siteConfig,
  className,
  cardClass,
}: {
  siteConfig: SiteConfig;
  className?: string;
  cardClass: string;
}) {
  const { services } = siteConfig;

  return (
    <div className={className ?? "grid gap-6 sm:grid-cols-2"}>
      {services.items.map((service) => (
        <article
          key={service.title}
          className={`group transition-colors hover:bg-surface-elevated ${cardClass}`}
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
            <Icon name={service.icon} />
          </div>
          <h3 className="font-display mt-5 text-lg font-semibold text-foreground">
            {service.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {service.description}
          </p>
        </article>
      ))}

      {services.pricing ? (
        <article className="rounded-[var(--radius-card)] border border-accent/30 bg-accent/10 p-6 sm:col-span-2">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {services.pricing.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {services.pricing.description}
          </p>
        </article>
      ) : null}
    </div>
  );
}

export function TradeServicesSection({ siteConfig }: Props) {
  const { services, images } = siteConfig;
  const layout = resolveTradeLayoutFromConfig(siteConfig);
  const hasServicesImage = Boolean(images?.services?.src);
  const showImage = layout.servicesImageSide !== "none" && hasServicesImage;
  const imageOnLeft = layout.servicesImageSide === "left";
  const cardClass = tradeCardClass(layout.cardStyle);

  return (
    <TradeSection id={services.id} sectionRule={layout.sectionRule}>
      <SectionHeading
        variant="trade"
        eyebrow={services.eyebrow}
        title={services.title}
        description={services.description}
      />

      {showImage ? (
        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:items-stretch">
          {imageOnLeft ? (
            <>
              <TradeImage
                src={images?.services.src}
                alt={images?.services.alt ?? services.title}
                className="min-h-[280px] lg:min-h-full"
              />
              <ServiceCards
                siteConfig={siteConfig}
                className="grid gap-6 sm:grid-cols-1"
                cardClass={cardClass}
              />
            </>
          ) : (
            <>
              <ServiceCards
                siteConfig={siteConfig}
                className="grid gap-6 sm:grid-cols-1"
                cardClass={cardClass}
              />
              <TradeImage
                src={images?.services.src}
                alt={images?.services.alt ?? services.title}
                className="min-h-[280px] lg:min-h-full"
              />
            </>
          )}
        </div>
      ) : (
        <ServiceCards
          siteConfig={siteConfig}
          className="mt-16 grid gap-6 sm:grid-cols-2"
          cardClass={cardClass}
        />
      )}
    </TradeSection>
  );
}
