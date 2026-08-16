import { BeautyButton } from "./BeautyButton";
import { BeautyDecorativeRings } from "./BeautyDecorativeRings";
import { BeautyBrowserFrame } from "./BeautyBrowserFrame";
import { BeautyHeroWebsitePreview } from "./BeautyHeroWebsitePreview";
import { BeautyImage } from "./BeautyImage";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BeautyHeroSection({ siteConfig }: Props) {
  const { hero, services, contact, images } = siteConfig;
  const secondaryHref = hero.secondaryCtaHref ?? `#${services.id}`;
  const useBrowserFrame = images?.hero?.frame === "browser";

  return (
    <section className="relative overflow-hidden bg-background px-4 pb-24 pt-28 sm:px-6 sm:pb-28 sm:pt-32 lg:pb-32">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <div className="relative order-2 flex h-full min-h-[480px] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] bg-accent p-8 sm:p-10 lg:order-1 lg:min-h-[640px] lg:p-14">
          <BeautyDecorativeRings />

          <div className="relative flex flex-1 flex-col justify-center">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-foreground/70">
              <span
                className="size-1.5 rounded-full bg-accent-foreground/50"
                aria-hidden="true"
              />
              {hero.badge}
            </p>
            <h1 className="font-display mt-8 text-[2.75rem] leading-[0.95] text-accent-foreground sm:text-6xl lg:text-7xl">
              {hero.title}{" "}
              <span className="block font-normal italic sm:inline">
                {hero.titleHighlight}
              </span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-accent-foreground/75 sm:mt-10 sm:text-lg">
              {hero.description}
            </p>
          </div>

          <div className="relative mt-10 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:flex-wrap">
            <BeautyButton href={`#${contact.id}`} variant="cream">
              {hero.primaryCta}
            </BeautyButton>
            <BeautyButton href={secondaryHref} variant="outline-cream">
              {hero.secondaryCta}
            </BeautyButton>
          </div>
        </div>

        <div className="relative order-1 h-full min-h-[480px] lg:order-2 lg:min-h-[640px]">
          {useBrowserFrame ? (
            <BeautyBrowserFrame
              url="studio-maja.si"
              className="h-full min-h-[480px] lg:min-h-[640px]"
            >
              <BeautyHeroWebsitePreview />
            </BeautyBrowserFrame>
          ) : (
            <BeautyImage
              src={images?.hero.src}
              alt={images?.hero.alt ?? hero.badge}
              className="h-full min-h-[480px] lg:min-h-[640px]"
              priority
            />
          )}
        </div>
      </div>
    </section>
  );
}
