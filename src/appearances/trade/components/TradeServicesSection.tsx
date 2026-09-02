import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { iconWellClassForLook } from "@/catalog/look-styles";
import { resolveLookDesignTokens } from "@/catalog/resolve-look";
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
  iconWellClass,
  pricingCardClass,
}: {
  siteConfig: SiteConfig;
  className?: string;
  cardClass: string;
  iconWellClass: string;
  pricingCardClass: string;
}) {
  const { services } = siteConfig;

  return (
    <div className={className ?? "grid gap-6 sm:grid-cols-2"}>
      {services.items.map((service) => (
        <article
          key={service.title}
          className={`group transition-colors hover:bg-surface-elevated ${cardClass}`}
        >
          <div className={`flex size-12 items-center justify-center bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground ${iconWellClass}`}>
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
        <article className={`border border-accent/30 bg-accent/10 p-6 sm:col-span-2 ${pricingCardClass}`}>
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
  const designTokens = resolveLookDesignTokens(siteConfig);
  const cardClass = tradeCardClass(layout.cardStyle, designTokens);
  const iconWellClass = designTokens
    ? iconWellClassForLook(designTokens)
    : "rounded-xl";
  const pricingCardClass = "rounded-[var(--radius-card)]";
  const hasServicesImage = Boolean(images?.services?.src);
  const showImage = layout.servicesImageSide !== "none" && hasServicesImage;
  const imageOnLeft = layout.servicesImageSide === "left";

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
                srcFallback={images?.services.srcFallback}
                alt={images?.services.alt ?? services.title}
                width={images?.services.width}
                height={images?.services.height}
                className="min-h-[280px] lg:min-h-full"
              />
              <ServiceCards
                siteConfig={siteConfig}
                className="grid gap-6 sm:grid-cols-1"
                cardClass={cardClass}
                iconWellClass={iconWellClass}
                pricingCardClass={pricingCardClass}
              />
            </>
          ) : (
            <>
              <ServiceCards
                siteConfig={siteConfig}
                className="grid gap-6 sm:grid-cols-1"
                cardClass={cardClass}
                iconWellClass={iconWellClass}
                pricingCardClass={pricingCardClass}
              />
              <TradeImage
                src={images?.services.src}
                srcFallback={images?.services.srcFallback}
                alt={images?.services.alt ?? services.title}
                width={images?.services.width}
                height={images?.services.height}
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
          iconWellClass={iconWellClass}
          pricingCardClass={pricingCardClass}
        />
      )}
    </TradeSection>
  );
}
