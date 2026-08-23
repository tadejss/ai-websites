import { ZbrendirajSectionHeading } from "./ZbrendirajSectionHeading";
import { zbBodyText } from "../styles";
import type { SiteConfig } from "@/content/types/site";

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
        <ZbrendirajSectionHeading
          align="left"
          eyebrow={steps.eyebrow}
          title={steps.title}
        />

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.items.map((item, index) => (
            <li key={item} className="relative">
              <p className="font-display text-5xl leading-none text-accent/40 sm:text-6xl">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className={`mt-5 text-lg leading-relaxed text-white sm:text-xl`}>
                {item}
              </p>
              {index < steps.items.length - 1 ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-6 hidden h-px w-8 translate-x-1/2 bg-accent/30 md:block"
                />
              ) : null}
            </li>
          ))}
        </ol>

        <p className={`mt-12 max-w-2xl ${zbBodyText}`}>
          Brez tednov usklajevanj. Od osnovnih informacij do objavljene strani v
          nekaj dneh.
        </p>
      </div>
    </section>
  );
}
