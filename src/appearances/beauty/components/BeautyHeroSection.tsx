import { BeautyButton } from "./BeautyButton";
import { BeautyDecorativeRings } from "./BeautyDecorativeRings";
import { BeautyBrowserFrame } from "./BeautyBrowserFrame";
import { BeautyHeroWebsitePreview } from "./BeautyHeroWebsitePreview";
import { BeautyImage } from "./BeautyImage";
import { heroStyleFlags, ICON_RADIUS_CLASS } from "@/catalog/look-styles";
import { resolveLookDesignTokens } from "@/catalog/resolve-look";
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
  const designTokens = resolveLookDesignTokens(siteConfig);
  const heroFlags = designTokens ? heroStyleFlags(designTokens) : null;
  const secondaryHref = hero.secondaryCtaHref ?? `#${services.id}`;
  const useBrowserFrame = images?.hero?.frame === "browser";
  const hasHeroMedia = useBrowserFrame || Boolean(images?.hero?.src);
  const showImage = layout.heroImageSide !== "none" && hasHeroMedia;
  const imageOnLeft = layout.heroImageSide === "left";
  const copyOrder = showImage
    ? imageOnLeft
      ? "order-1 lg:order-2"
      : "order-1 lg:order-1"
    : "order-1";
  const imageOrder = imageOnLeft ? "order-2 lg:order-1" : "order-2 lg:order-2";
  const copyWide = !showImage || layout.heroRatio === "full-copy";
  const copyMaxWidth = copyWide ? "max-w-3xl" : "max-w-md";
  const useAccentCard = heroFlags ? heroFlags.useAccentHeroCard : true;
  const isTypographic = heroFlags?.isTypographic ?? false;
  const isPhotoDominant = heroFlags?.isPhotoDominant ?? false;

  const showBadge = Boolean(hero.badge?.trim());

  const copyContent = (
    <>
      {showBadge ? (
        <p
          className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] ${useAccentCard ? "text-accent-foreground/70" : "text-muted"}`}
        >
          <span
            className={`size-1.5 ${ICON_RADIUS_CLASS} ${useAccentCard ? "bg-accent-foreground/50" : "bg-accent"}`}
            aria-hidden="true"
          />
          {hero.badge}
        </p>
      ) : null}
      <h1
        className={`font-display text-[2.75rem] leading-[0.95] sm:text-6xl lg:text-7xl ${showBadge ? "mt-8" : ""} ${useAccentCard ? "text-accent-foreground" : "text-foreground"} ${isTypographic ? "tracking-[var(--heading-tracking)]" : ""}`}
      >
        {hero.title}{" "}
        <span className="block font-normal italic sm:inline">
          {hero.titleHighlight}
        </span>
      </h1>
      <p
        className={`mt-8 text-base leading-relaxed sm:mt-10 sm:text-lg ${copyMaxWidth} ${useAccentCard ? "text-accent-foreground/75" : "text-muted"}`}
      >
        {hero.description}
      </p>
      <div className="relative mt-10 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:flex-wrap">
        <BeautyButton href={`#${contact.id}`} variant={useAccentCard ? "cream" : "chocolate"}>
          {hero.primaryCta}
        </BeautyButton>
        <BeautyButton
          href={secondaryHref}
          variant={useAccentCard ? "outline-cream" : "outline-chocolate"}
        >
          {hero.secondaryCta}
        </BeautyButton>
      </div>
    </>
  );

  const copyCard = (
    <div
      className={`relative flex h-full min-h-[480px] flex-col justify-between overflow-hidden ${
        copyWide ? "w-full" : ""
      } ${
        useAccentCard
          ? "rounded-[var(--radius-card)] bg-accent p-8 sm:p-10 lg:min-h-[640px] lg:p-14"
          : isTypographic
            ? "p-2 sm:p-4 lg:min-h-[520px]"
            : "rounded-[var(--radius-card)] border border-border bg-surface p-8 sm:p-10 lg:min-h-[640px] lg:p-14"
      }`}
    >
      {useAccentCard ? <BeautyDecorativeRings /> : null}

      <div className="relative flex flex-1 flex-col justify-center">{copyContent}</div>
    </div>
  );

  const photoDominantImage = (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-card)] ${
        isPhotoDominant
          ? "min-h-[320px] w-full max-h-[50vh] lg:max-h-none lg:h-full lg:min-h-[640px]"
          : ""
      }`}
    >
      <BeautyImage
        src={images?.hero.src}
        srcFallback={images?.hero.srcFallback}
        alt={images?.hero.alt ?? hero.badge}
        width={images?.hero.width}
        height={images?.hero.height}
        className="h-full min-h-[320px] w-full object-cover lg:min-h-[640px]"
        priority
      />
    </div>
  );

  return (
    <section className="relative overflow-hidden bg-background px-4 pb-24 pt-28 sm:px-6 sm:pb-28 sm:pt-32 lg:pb-32">
      {isPhotoDominant && showImage ? (
        <div className={heroGridClass(layout.heroRatio ?? "5050", true)}>
          <div className={copyOrder}>{copyCard}</div>
          <div className={imageOrder}>{photoDominantImage}</div>
        </div>
      ) : (
        <div className={heroGridClass(layout.heroRatio ?? "5050", showImage)}>
          {copyCard}

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
                  srcFallback={images?.hero.srcFallback}
                  alt={images?.hero.alt ?? hero.badge}
                  width={images?.hero.width}
                  height={images?.hero.height}
                  className="h-full min-h-[480px] lg:min-h-[640px]"
                  priority
                />
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
