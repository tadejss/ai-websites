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
      ? "rounded-[var(--radius-card)] bg-surface/70 p-5 backdrop-blur-sm"
      : "rounded-[var(--radius-card)] border border-border bg-surface/50 p-5 backdrop-blur-sm";

  return emphasize ? `${base} sm:p-7` : base;
}

export function TradeHeroSection({ siteConfig }: Props) {
  const { hero, services, contact, images } = siteConfig;
  const layout = resolveTradeLayoutFromConfig(siteConfig);
  const hasHeroMedia = Boolean(images?.hero?.src);
  const showImage = layout.heroImageSide !== "none" && hasHeroMedia;
  const imageOnLeft = layout.heroImageSide === "left";
  const copyOrder = showImage
    ? imageOnLeft
      ? "order-2 lg:order-2"
      : "order-2 lg:order-1"
    : "order-1";
  const imageOrder = imageOnLeft ? "order-1 lg:order-1" : "order-1 lg:order-2";
  const copyWide = !showImage || layout.heroRatio === "full-copy";
  const emphasizeStats = layout.profileId === "stats-forward";
  const atmosphere = layout.heroAtmosphere ?? "grid";

  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {atmosphere !== "plain" ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent)]"
          aria-hidden="true"
        />
      ) : null}

      {atmosphere === "grid" ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_6%,transparent)_1px,transparent_1px)] bg-size-[4rem_4rem]"
          aria-hidden="true"
        />
      ) : null}

      <div className="relative mx-auto max-w-6xl px-6">
        <div className={heroGridClass(layout.heroRatio ?? "5050", showImage)}>
          <div className={`${copyOrder} ${copyWide ? "w-full" : ""}`}>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-sm text-muted">
              <span
                className="size-2 rounded-full bg-accent"
                aria-hidden="true"
              />
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
                className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                {hero.primaryCta}
              </a>
              <a
                href={`#${services.id}`}
                className="inline-flex items-center justify-center rounded-full border border-border px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-surface"
              >
                {hero.secondaryCta}
              </a>
            </div>
          </div>

          {showImage ? (
            <TradeImage
              src={images?.hero.src}
              alt={images?.hero.alt ?? hero.badge}
              className={`min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] ${imageOrder}`}
              priority
            />
          ) : null}
        </div>

        <dl
          className={`mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 ${emphasizeStats ? "sm:gap-8" : ""}`}
        >
          {hero.stats.map((item) => (
            <div
              key={item.label}
              className={statsCardClass(layout.cardStyle, emphasizeStats)}
            >
              <dt
                className={`font-display font-semibold text-accent ${emphasizeStats ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}
              >
                {item.value}
              </dt>
              <dd className="mt-1 text-sm text-muted">{item.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
