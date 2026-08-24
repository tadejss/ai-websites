import { BeautyButton } from "./BeautyButton";
import { BeautyDecorativeRings } from "./BeautyDecorativeRings";
import { BeautyBrowserFrame } from "./BeautyBrowserFrame";
import { BeautyHeroWebsitePreview } from "./BeautyHeroWebsitePreview";
import { BeautyImage } from "./BeautyImage";
import { resolveBeautyLayout } from "../assign-layout";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

function heroGridClass(ratio: string, showImage: boolean): string {
  if (!showImage || ratio === "full-copy") {
    return "mx-auto grid max-w-7xl gap-6 lg:grid-cols-1 lg:items-stretch lg:gap-8";
  }

  if (ratio === "6040") {
    return "mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch lg:gap-8";
  }

  return "mx-auto grid max-w-7xl gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8";
}

export function BeautyHeroSection({ siteConfig }: Props) {
  const { hero, services, contact, images } = siteConfig;
  const layout = resolveBeautyLayout(siteConfig.layout);
  const secondaryHref = hero.secondaryCtaHref ?? `#${services.id}`;
  const useBrowserFrame = images?.hero?.frame === "browser";
  const hasHeroMedia = useBrowserFrame || Boolean(images?.hero?.src);
  const showImage = layout.heroImageSide !== "none" && hasHeroMedia;
  const imageOnLeft = layout.heroImageSide === "left";
  const copyOrder = showImage
    ? imageOnLeft
      ? "order-2 lg:order-2"
      : "order-2 lg:order-1"
    : "order-1";
  const imageOrder = imageOnLeft ? "order-1 lg:order-1" : "order-1 lg:order-2";
  const copyWide = !showImage || layout.heroRatio === "full-copy";
  const copyMaxWidth = copyWide ? "max-w-3xl" : "max-w-md";

  return (
    <section className="relative overflow-hidden bg-background px-4 pb-24 pt-28 sm:px-6 sm:pb-28 sm:pt-32 lg:pb-32">
      <div className={heroGridClass(layout.heroRatio ?? "5050", showImage)}>
        <div
          className={`relative flex h-full min-h-[480px] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] bg-accent p-8 sm:p-10 lg:min-h-[640px] lg:p-14 ${copyOrder} ${copyWide ? "w-full" : ""}`}
        >
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
            <p
              className={`mt-8 text-base leading-relaxed text-accent-foreground/75 sm:mt-10 sm:text-lg ${copyMaxWidth}`}
            >
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

        {showImage ? (
          <div
            className={`relative h-full min-h-[480px] lg:min-h-[640px] ${imageOrder}`}
          >
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
        ) : null}
      </div>

      {hero.stats.length > 0 ? (
        <dl className="mx-auto mt-10 grid max-w-7xl grid-cols-2 gap-4 sm:mt-14 sm:grid-cols-4 sm:gap-5">
          {hero.stats.map((item) => (
            <div
              key={`${item.value}-${item.label}`}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
            >
              <dt className="font-display text-2xl font-semibold text-accent sm:text-3xl">
                {item.value}
              </dt>
              <dd className="mt-1 text-sm text-muted">{item.label}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
