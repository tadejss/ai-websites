import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cardClassForLook, iconWellClassForLook, sectionSpacingForLook } from "@/catalog/look-styles";
import { resolveLookDesignTokens } from "@/catalog/resolve-look";
import { BeautyImage } from "./BeautyImage";
import { resolveBeautyLayout } from "../assign-layout";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

function ServiceCards({
  siteConfig,
  className,
  cardClass,
  listLayout,
  iconWellClass,
}: {
  siteConfig: SiteConfig;
  className?: string;
  cardClass: string;
  listLayout?: boolean;
  iconWellClass: string;
}) {
  const { services } = siteConfig;

  return (
    <div
      className={
        className ??
        (listLayout ? "flex flex-col gap-8 divide-y divide-border" : "flex flex-col gap-5")
      }
    >
      {services.items.map((service) => (
        <article
          key={service.title}
          className={`${cardClass} transition-colors hover:bg-surface-elevated`}
        >
          <div className="flex items-start gap-5">
            <div className={`flex size-12 shrink-0 items-center justify-center border border-accent/10 bg-background text-accent ${iconWellClass}`}>
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
        <article className={`${cardClass} border border-accent/20 bg-accent/10 md:col-span-2`}>
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
  const designTokens = resolveLookDesignTokens(siteConfig);
  const cardClass = designTokens
    ? `${cardClassForLook(designTokens)} p-7 sm:p-9`
    : "rounded-[var(--radius-card)] bg-surface p-7 sm:p-9";
  const iconWellClass = designTokens
    ? iconWellClassForLook(designTokens)
    : "rounded-full";
  const listLayout = designTokens?.cardTreatment === "none";
  const sectionClass = designTokens
    ? sectionSpacingForLook(designTokens)
    : "py-24 sm:py-32";
  const hasServicesImage = Boolean(images?.services?.src);
  const showImage = layout.servicesImageSide !== "none" && hasServicesImage;
  const imageOnLeft = layout.servicesImageSide === "left";

  return (
    <section
      id={services.id}
      className={`bg-background px-4 sm:px-6 ${sectionClass}`}
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
                <ServiceCards siteConfig={siteConfig} cardClass={cardClass} listLayout={listLayout} iconWellClass={iconWellClass} />
              </>
            ) : (
              <>
                <ServiceCards siteConfig={siteConfig} cardClass={cardClass} listLayout={listLayout} iconWellClass={iconWellClass} />
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
            cardClass={cardClass}
            listLayout={listLayout}
            iconWellClass={iconWellClass}
            className={`mt-14 ${listLayout ? "flex flex-col gap-8" : "grid gap-5 md:grid-cols-2"}`}
          />
        )}
      </div>
    </section>
  );
}
