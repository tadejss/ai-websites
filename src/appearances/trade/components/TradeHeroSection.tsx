import Image from "next/image";
import {
  formatHeroStatCaption,
  formatHeroStatTitle,
} from "@/appearances/beauty/utils/format-card-title";
import { buttonRadiusClass, ICON_RADIUS_CLASS } from "@/catalog/look-styles";
import { TradeImage } from "./TradeImage";
import { resolveTradeLayoutFromConfig } from "./trade-layout";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

function heroGridClass(ratio: string, showImage: boolean): string {
  if (!showImage || ratio === "full-copy") {
    return "grid gap-10 lg:grid-cols-1";
  }

  if (ratio === "6040") {
    return "grid items-center gap-10 lg:grid-cols-[1.35fr_0.65fr]";
  }

  return "grid items-center gap-10 lg:grid-cols-2";
}

function statsCardClass(cardStyle: string | undefined, emphasize: boolean): string {
  const base =
    cardStyle === "soft"
      ? "flex min-h-[5.5rem] items-center justify-center rounded-[var(--radius-card)] bg-surface/70 px-4 py-5 text-center backdrop-blur-sm sm:min-h-[6.5rem]"
      : "flex min-h-[5.5rem] items-center justify-center rounded-[var(--radius-card)] border border-border bg-surface/50 px-4 py-5 text-center backdrop-blur-sm sm:min-h-[6.5rem]";

  return emphasize ? `${base} sm:min-h-[7.5rem] sm:px-5 sm:py-6` : base;
}

export function TradeHeroSection({ siteConfig }: Props) {
  const { hero, services, contact, images } = siteConfig;
  const layout = resolveTradeLayoutFromConfig(siteConfig);
  const buttonRadius = buttonRadiusClass();
  const atmosphere = layout.heroAtmosphere ?? "grid";
  const hasHeroMedia = Boolean(images?.hero?.src);
  const photoHero = atmosphere === "photo" && hasHeroMedia;
  const showImage =
    !photoHero && layout.heroImageSide !== "none" && hasHeroMedia;
  const imageOnLeft = layout.heroImageSide === "left";
  const copyOrder = showImage
    ? imageOnLeft
      ? "order-1 lg:order-2"
      : "order-1 lg:order-1"
    : "order-1";
  const imageOrder = imageOnLeft ? "order-2 lg:order-1" : "order-2 lg:order-2";
  const copyWide = !showImage || layout.heroRatio === "full-copy";
  const emphasizeStats = layout.profileId === "stats-forward";

  const copyBlock = (
    <>
      <p className={`inline-flex items-center gap-2 border border-border bg-surface/60 px-4 py-1.5 text-sm text-muted ${buttonRadius}`}>
        <span className={`size-2 ${ICON_RADIUS_CLASS} bg-accent`} aria-hidden="true" />
        {hero.badge}
      </p>
      <h1 className="font-display mt-6 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        {hero.title}{" "}
        <span className="text-accent">{hero.titleHighlight}</span>
      </h1>
      <p
        className={`mt-6 text-lg leading-relaxed text-muted sm:text-xl ${copyWide ? "max-w-2xl" : "max-w-xl"}`}
      >
        {hero.description}
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <a
          href={`#${contact.id}`}
          className={`inline-flex items-center justify-center bg-accent px-8 py-3.5 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-hover ${buttonRadius}`}
        >
          {hero.primaryCta}
        </a>
        <a
          href={`#${services.id}`}
          className={`inline-flex items-center justify-center border border-border px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-surface ${buttonRadius}`}
        >
          {hero.secondaryCta}
        </a>
      </div>
    </>
  );

  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {photoHero ? (
        <>
          <Image
            src={images!.hero.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover blur-sm scale-105"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-background/70"
            aria-hidden="true"
          />
        </>
      ) : null}

      {!photoHero && atmosphere !== "plain" ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent)]"
          aria-hidden="true"
        />
      ) : null}

      {!photoHero && atmosphere === "grid" ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_6%,transparent)_1px,transparent_1px)] bg-size-[4rem_4rem]"
          aria-hidden="true"
        />
      ) : null}

      <div className="relative mx-auto max-w-6xl px-6">
        <div className={heroGridClass(layout.heroRatio ?? "5050", showImage)}>
          <div className={`${copyOrder} ${copyWide ? "w-full" : ""}`}>
            {photoHero ? (
              <div className="max-w-3xl rounded-[var(--radius-card)] border border-border bg-surface/80 p-8 shadow-lg backdrop-blur-md sm:p-10 lg:p-12">
                {copyBlock}
              </div>
            ) : (
              copyBlock
            )}
          </div>

          {showImage ? (
            <TradeImage
              src={images?.hero.src}
              srcFallback={images?.hero.srcFallback}
              alt={images?.hero.alt ?? hero.badge}
              width={images?.hero.width}
              height={images?.hero.height}
              className={`min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] ${imageOrder}`}
              priority
            />
          ) : null}
        </div>

        <dl
          className={`mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 ${emphasizeStats ? "sm:gap-8" : ""}`}
        >
          {hero.stats.map((item) => {
            const title = formatHeroStatTitle(item);
            const caption = formatHeroStatCaption(item);

            return (
              <div
                key={title}
                className={statsCardClass(layout.cardStyle, emphasizeStats)}
              >
                <div>
                  <dt
                    className={`font-display font-semibold leading-snug text-accent ${emphasizeStats ? "text-lg sm:text-xl" : "text-base sm:text-lg"}`}
                  >
                    {title}
                  </dt>
                  {caption ? (
                    <dd className="mt-1 text-xs text-muted sm:text-sm">{caption}</dd>
                  ) : null}
                </div>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
