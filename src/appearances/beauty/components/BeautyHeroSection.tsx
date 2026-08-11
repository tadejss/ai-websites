import { BeautyButton } from "./BeautyButton";
import { BeautyDecorativeRings } from "./BeautyDecorativeRings";
import { BeautyImagePanel } from "./BeautyImagePanel";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BeautyHeroSection({ siteConfig }: Props) {
  const { hero, services, contact } = siteConfig;

  return (
    <section className="relative overflow-hidden bg-background px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:pb-28">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
        <div className="relative order-2 flex min-h-[440px] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] bg-accent p-8 sm:p-10 lg:order-1 lg:min-h-[600px] lg:p-12">
          <BeautyDecorativeRings />

          <div className="relative">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-foreground/70">
              <span
                className="size-1.5 rounded-full bg-accent-foreground/50"
                aria-hidden="true"
              />
              {hero.badge}
            </p>
            <h1 className="font-display mt-8 text-[2.75rem] leading-[0.95] text-accent-foreground sm:text-6xl lg:text-7xl">
              {hero.title}{" "}
              <span className="block italic font-normal sm:inline">
                {hero.titleHighlight}
              </span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-accent-foreground/75 sm:text-lg">
              {hero.description}
            </p>
          </div>

          <div className="relative mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <BeautyButton href={`#${contact.id}`} variant="cream">
              {hero.primaryCta}
            </BeautyButton>
            <BeautyButton href={`#${services.id}`} variant="outline-cream">
              {hero.secondaryCta}
            </BeautyButton>
          </div>
        </div>

        <div className="relative order-1 lg:order-2">
          <BeautyImagePanel className="min-h-[300px] sm:min-h-[400px] lg:min-h-[600px]" />
          <div
            className="absolute bottom-8 right-8 hidden size-28 items-center justify-center rounded-full border border-accent/15 bg-background/90 text-accent backdrop-blur-sm lg:flex"
            aria-hidden="true"
          >
            <span className="animate-[spin_24s_linear_infinite] px-2 text-center text-[9px] font-semibold uppercase tracking-[0.2em]">
              {hero.badge} • {hero.badge} •
            </span>
          </div>
        </div>
      </div>

      <dl className="mx-auto mt-10 grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-4">
        {hero.stats.map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-card)] bg-surface px-5 py-7 text-center"
          >
            <dt className="font-display text-3xl text-foreground sm:text-4xl">
              {item.value}
            </dt>
            <dd className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              {item.label}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
