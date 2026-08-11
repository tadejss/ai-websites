import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BeautyImagePanel } from "./BeautyImagePanel";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BeautyServicesSection({ siteConfig }: Props) {
  const { services } = siteConfig;

  return (
    <section id={services.id} className="bg-background px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          variant="beauty"
          eyebrow={services.eyebrow}
          title={services.title}
          description={services.description}
        />

        <div className="mt-12 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {services.items.map((service) => (
            <span
              key={service.title}
              className="shrink-0 snap-start rounded-full border border-accent/15 bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
            >
              {service.title}
            </span>
          ))}
        </div>

        <div className="relative mt-16 lg:mt-20">
          <div className="hidden lg:absolute lg:right-0 lg:top-0 lg:block lg:w-[42%]">
            <BeautyImagePanel className="min-h-[560px]" />
          </div>

          <div className="grid gap-5 lg:max-w-[55%]">
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
        </div>
      </div>
    </section>
  );
}
