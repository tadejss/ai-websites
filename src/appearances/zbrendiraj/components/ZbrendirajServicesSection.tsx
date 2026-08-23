import { zbBodyText, zbSectionEyebrow } from "../styles";
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
        <div className="mx-auto max-w-3xl text-center">
          <p className={zbSectionEyebrow}>{services.eyebrow}</p>
          <h2 className="font-display mt-5 text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            {services.title}
          </h2>
          {services.description ? (
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#D0D0D0] sm:text-lg">
              {services.description}
            </p>
          ) : null}
        </div>

        <ol className="mt-16 border-t border-white/15 sm:mt-20">
          {services.items.map((service, index) => (
            <li
              key={service.title}
              className="grid gap-4 border-b border-white/15 py-10 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1.15fr)] sm:items-start sm:gap-12 sm:py-14"
            >
              <p
                aria-hidden="true"
                className="font-display text-5xl leading-none text-accent/45 sm:text-6xl"
              >
                {String(index + 1).padStart(2, "0")}
              </p>

              <h3 className="font-display text-2xl leading-tight text-white sm:text-3xl lg:text-4xl">
                <span className="sr-only">
                  {String(index + 1).padStart(2, "0")} —{" "}
                </span>
                {service.title}
              </h3>

              <p className={`sm:pt-1 ${zbBodyText}`}>{service.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
