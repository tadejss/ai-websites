import { zbBodyText, zbSectionEyebrow } from "../styles";
import {
  getWhyChooseUsStepDescription,
  getWhyChooseUsStepTitle,
  type SiteConfig,
} from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function ZbrendirajStepsSection({ siteConfig }: Props) {
  const steps = siteConfig.whyChooseUs.steps;

  if (!steps) {
    return null;
  }

  return (
    <section
      id={steps.id}
      className="bg-black px-4 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className={zbSectionEyebrow}>{steps.eyebrow}</p>
          <h2 className="font-display mt-5 text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            {steps.title}
          </h2>
        </div>

        <ol className="relative mt-16 sm:mt-20 md:grid md:grid-cols-4 md:gap-8 lg:gap-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 left-[1.125rem] top-2 w-px bg-white/15 md:hidden"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-white/15 md:block"
          />

          {steps.items.map((step, index) => {
            const title = getWhyChooseUsStepTitle(step);
            const description = getWhyChooseUsStepDescription(step);

            return (
              <li
                key={title}
                className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-5 py-6 first:pt-0 last:pb-0 md:block md:py-0"
              >
                <p
                  aria-hidden="true"
                  className="relative z-10 bg-black font-display text-4xl leading-none text-accent/50 sm:text-5xl md:inline-block md:pr-3"
                >
                  {String(index + 1).padStart(2, "0")}
                </p>

                <div className="md:mt-8">
                  <h3 className="font-display text-xl leading-tight text-white sm:text-2xl">
                    <span className="sr-only">
                      {String(index + 1).padStart(2, "0")} —{" "}
                    </span>
                    {title}
                  </h3>
                  {description ? (
                    <p className={`mt-3 max-w-xs ${zbBodyText}`}>{description}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
