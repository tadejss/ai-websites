import { Icon } from "@/content/icons";
import { ZbrendirajSectionHeading } from "./ZbrendirajSectionHeading";
import { zbBodyText } from "../styles";
import type { IconName, SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

const SERVICE_ICONS: IconName[] = [
  "sparkles",
  "building",
  "phone",
  "bolt",
];

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

        <div className="mt-16 grid gap-x-12 gap-y-14 sm:grid-cols-2">
          {services.items.map((service, index) => {
            const icon = SERVICE_ICONS[index] ?? service.icon;

            return (
              <article
                key={service.title}
                className={
                  index === 0
                    ? "sm:col-span-2 sm:grid sm:grid-cols-[auto_1fr] sm:items-start sm:gap-10"
                    : ""
                }
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-accent text-black">
                  <Icon name={icon} />
                </div>
                <div className={index === 0 ? "mt-6 sm:mt-0" : "mt-6"}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent/70">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-display mt-2 text-3xl leading-tight text-white sm:text-4xl">
                    {service.title}
                  </h3>
                  <p
                    className={`mt-4 max-w-xl ${zbBodyText} ${
                      index === 0 ? "sm:text-lg" : ""
                    }`}
                  >
                    {service.description}
                  </p>
                  <div
                    aria-hidden="true"
                    className="mt-6 h-px w-16 bg-accent/50"
                  />
                </div>
              </article>
            );
          })}
        </div>

        {services.pricing ? (
          <div className="mt-16 border-t border-accent/40 pt-10 sm:flex sm:items-end sm:justify-between sm:gap-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
                Cena
              </p>
              <h3 className="font-display mt-3 text-3xl leading-tight text-white sm:text-4xl">
                {services.pricing.title}
              </h3>
            </div>
            <p className={`mt-4 max-w-md sm:mt-0 sm:text-right ${zbBodyText}`}>
              {services.pricing.description}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
