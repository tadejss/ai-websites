import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function HeroSection({ siteConfig }: Props) {
  const { hero, services, contact } = siteConfig;

  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,158,11,0.18),transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[4rem_4rem]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-sm text-muted">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            {hero.badge}
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {hero.title}{" "}
            <span className="text-accent">{hero.titleHighlight}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            {hero.description}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href={`#${contact.id}`}
              className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-base font-semibold text-background transition-colors hover:bg-accent-hover"
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

        <dl className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {hero.stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-surface/50 p-5 backdrop-blur-sm"
            >
              <dt className="text-2xl font-bold text-accent sm:text-3xl">
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
