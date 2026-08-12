import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BeautyImage } from "./BeautyImage";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BeautyServicesSection({ siteConfig }: Props) {
  const { services, images } = siteConfig;

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

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
          <div className="flex flex-col gap-5">
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
          </div>

          <BeautyImage
            src={images?.services.src}
            alt={images?.services.alt ?? services.title}
            className="min-h-[320px] lg:min-h-full"
          />
        </div>
      </div>
    </section>
  );
}
