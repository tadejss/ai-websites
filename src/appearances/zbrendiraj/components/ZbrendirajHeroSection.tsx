import { ZbrendirajButton } from "./ZbrendirajButton";
import { zbSectionEyebrow } from "../styles";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function ZbrendirajHeroSection({ siteConfig }: Props) {
  const { hero, contact } = siteConfig;
  const secondaryHref = hero.secondaryCtaHref ?? "#primere";

  return (
    <section className="relative overflow-hidden bg-black px-4 pb-24 pt-28 sm:px-6 sm:pb-28 sm:pt-32 lg:pb-32">
      <div className="mx-auto max-w-7xl">
        <div className="relative flex min-h-[480px] flex-col justify-between rounded-[var(--radius-card)] border border-accent bg-black p-8 sm:min-h-[560px] sm:p-10 lg:min-h-[600px] lg:p-14">
          <div className="flex flex-1 flex-col justify-center">
            <p className={`inline-flex items-center gap-2 ${zbSectionEyebrow}`}>
              <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              {hero.badge}
            </p>
            <h1 className="font-display mt-8 text-[2.85rem] leading-[0.9] text-white sm:text-[4.25rem] lg:text-[5.5rem]">
              {hero.title}{" "}
              <span className="block text-accent sm:inline">
                {hero.titleHighlight}
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-[#D0D0D0] sm:mt-10 sm:text-lg">
              {hero.description}
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:flex-wrap">
            <ZbrendirajButton href={`#${contact.id}`}>{hero.primaryCta}</ZbrendirajButton>
            <ZbrendirajButton href={secondaryHref} variant="outline">
              {hero.secondaryCta}
            </ZbrendirajButton>
          </div>
        </div>
      </div>
    </section>
  );
}
