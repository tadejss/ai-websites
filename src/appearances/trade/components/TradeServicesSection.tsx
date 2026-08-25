import { SectionHeading } from "@/components/ui/SectionHeading";
import { TextList, TextListItem } from "@/components/ui/TextListItem";
import { TradeImage } from "./TradeImage";
import { TradeSection } from "./TradeSection";
import { resolveTradeLayoutFromConfig } from "./trade-layout";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

function ServiceList({
  siteConfig,
  className,
}: {
  siteConfig: SiteConfig;
  className?: string;
}) {
  const { services } = siteConfig;

  return (
    <TextList variant="trade" className={className ?? "space-y-12"}>
      {services.items.map((service) => (
        <TextListItem
          key={service.title}
          variant="trade"
          title={service.title}
          description={service.description}
        />
      ))}

      {services.pricing ? (
        <TextListItem
          variant="trade"
          title={services.pricing.title}
          description={services.pricing.description}
        />
      ) : null}
    </TextList>
  );
}

export function TradeServicesSection({ siteConfig }: Props) {
  const { services, images } = siteConfig;
  const layout = resolveTradeLayoutFromConfig(siteConfig);
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
        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-start">
          {imageOnLeft ? (
            <>
              <TradeImage
                src={images?.services.src}
                alt={images?.services.alt ?? services.title}
                className="min-h-[280px] lg:min-h-[24rem]"
              />
              <ServiceList siteConfig={siteConfig} />
            </>
          ) : (
            <>
              <ServiceList siteConfig={siteConfig} />
              <TradeImage
                src={images?.services.src}
                alt={images?.services.alt ?? services.title}
                className="min-h-[280px] lg:min-h-[24rem]"
              />
            </>
          )}
        </div>
      ) : (
        <ServiceList
          siteConfig={siteConfig}
          className="mx-auto mt-16 max-w-2xl space-y-12"
        />
      )}
    </TradeSection>
  );
}
