import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BeautyImage } from "./BeautyImage";
import { resolveBeautyLayout } from "../assign-layout";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

function ServiceCards({
  siteConfig,
  className,
}: {
  siteConfig: SiteConfig;
  className?: string;
}) {
  const { services } = siteConfig;

  return (
    <div className={className ?? "flex flex-col gap-5"}>
      {services.items.map((service) => (
        <article
          key={service.title}
          className="rounded-[var(--radius-card)] bg-surface p-7 transition-colors hover:bg-surface-elevated sm:p-9"
        >
          <div className="flex items-start gap-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-accent/10 bg-background text-accent">
              <Icon name={service.icon} />
            </div>
            <div>
              <h3 className="font-display text-2xl leading-tight text-foreground sm:text-3xl">
                {service.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                {service.description}
              </p>
            </div>
          </div>
        </article>
      ))}

      {services.pricing ? (
        <article className="rounded-[var(--radius-card)] border border-accent/20 bg-accent/10 p-7 sm:p-9 md:col-span-2">
          <h3 className="font-display text-2xl leading-tight text-foreground sm:text-3xl">
            {services.pricing.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {services.pricing.description}
          </p>
        </article>
      ) : null}
    </div>
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
          <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
            {imageOnLeft ? (
              <>
                <BeautyImage
                  src={images?.services.src}
                  srcFallback={images?.services.srcFallback}
                  alt={images?.services.alt ?? services.title}
                  width={images?.services.width}
                  height={images?.services.height}
                  className="min-h-[320px] lg:min-h-full"
                />
                <ServiceCards siteConfig={siteConfig} />
              </>
            ) : (
              <>
                <ServiceCards siteConfig={siteConfig} />
                <BeautyImage
                  src={images?.services.src}
                  srcFallback={images?.services.srcFallback}
                  alt={images?.services.alt ?? services.title}
                  width={images?.services.width}
                  height={images?.services.height}
                  className="min-h-[320px] lg:min-h-full"
                />
              </>
            )}
          </div>
        ) : (
          <ServiceCards
            siteConfig={siteConfig}
            className="mt-14 grid gap-5 md:grid-cols-2"
          />
        )}
      </div>
    </section>
  );
}
