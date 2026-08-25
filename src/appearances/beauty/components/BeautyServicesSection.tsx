import { SectionHeading } from "@/components/ui/SectionHeading";
import { TextList, TextListItem } from "@/components/ui/TextListItem";
import { BeautyImage } from "./BeautyImage";
import { resolveBeautyLayout } from "../assign-layout";
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
    <TextList variant="beauty" className={className ?? "space-y-12"}>
      {services.items.map((service) => (
        <TextListItem
          key={service.title}
          variant="beauty"
          title={service.title}
          description={service.description}
        />
      ))}

      {services.pricing ? (
        <TextListItem
          variant="beauty"
          title={services.pricing.title}
          description={services.pricing.description}
        />
      ) : null}
    </TextList>
  );
}

export function BeautyServicesSection({ siteConfig }: Props) {
  const { services, images } = siteConfig;
  const layout = resolveBeautyLayout(siteConfig.layout);
  const hasServicesImage = Boolean(images?.services?.src);
  const showImage = layout.servicesImageSide !== "none" && hasServicesImage;
  const imageOnLeft = layout.servicesImageSide === "left";

  return (
    <section
      id={services.id}
      className="bg-background px-4 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          variant="beauty"
          eyebrow={services.eyebrow}
          title={services.title}
          description={services.description}
        />

        {showImage ? (
          <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
            {imageOnLeft ? (
              <>
                <BeautyImage
                  src={images?.services.src}
                  alt={images?.services.alt ?? services.title}
                  className="min-h-[320px] lg:min-h-[28rem]"
                />
                <ServiceList siteConfig={siteConfig} />
              </>
            ) : (
              <>
                <ServiceList siteConfig={siteConfig} />
                <BeautyImage
                  src={images?.services.src}
                  alt={images?.services.alt ?? services.title}
                  className="min-h-[320px] lg:min-h-[28rem]"
                />
              </>
            )}
          </div>
        ) : (
          <ServiceList
            siteConfig={siteConfig}
            className="mx-auto mt-14 max-w-2xl space-y-12"
          />
        )}
      </div>
    </section>
  );
}
