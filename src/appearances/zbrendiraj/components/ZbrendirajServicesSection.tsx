import { Icon } from "@/content/icons";
import { ZbrendirajSectionHeading } from "./ZbrendirajSectionHeading";
import { ZbrendirajTimelineGraphic } from "./ZbrendirajTimelineGraphic";
import { zbBodyText, zbCard, zbCardPadding, zbIconWrap } from "../styles";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function ZbrendirajServicesSection({ siteConfig }: Props) {
  const { services } = siteConfig;

  return (
    <section
      id={services.id}
      className="bg-black px-4 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <ZbrendirajSectionHeading
          eyebrow={services.eyebrow}
          title={services.title}
          description={services.description}
        />

        <div className="mt-14 flex flex-col gap-8 lg:flex-row lg:justify-between">
          <div className="flex w-full flex-col gap-5 lg:w-[80%]">
            {services.items.map((service) => (
              <article key={service.title} className={`${zbCard} ${zbCardPadding}`}>
                <div className="flex items-start gap-5">
                  <div className={zbIconWrap}>
                    <Icon name={service.icon} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl leading-tight text-white sm:text-3xl">
                      {service.title}
                    </h3>
                    <p className={`mt-3 ${zbBodyText}`}>{service.description}</p>
                  </div>
                </div>
              </article>
            ))}

            {services.pricing ? (
              <article className={`${zbCard} border-accent/40 ${zbCardPadding}`}>
                <div className="flex items-start gap-5">
                  <div className={zbIconWrap}>
                    <Icon name="service-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl leading-tight text-white sm:text-3xl">
                      {services.pricing.title}
                    </h3>
                    <p className={`mt-3 ${zbBodyText}`}>{services.pricing.description}</p>
                  </div>
                </div>
              </article>
            ) : null}
          </div>

          <div className={`relative min-h-[420px] w-full overflow-hidden lg:w-[20%] ${zbCard}`}>
            <ZbrendirajTimelineGraphic />
          </div>
        </div>
      </div>
    </section>
  );
}
