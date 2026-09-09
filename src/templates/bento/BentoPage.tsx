import type { SiteConfig } from "@/content/types/site";
import { PhoneCta } from "../shared/PhoneCta";
import { TemplateFooter } from "../shared/TemplateFooter";
import { TemplateGalleryCarousel } from "../shared/TemplateGalleryCarousel";
import { TemplateImage } from "../shared/TemplateImage";
import { TemplateTopBar } from "../shared/TemplateTopBar";
import { getAddress, getEmail, getHours } from "../shared/contact-data";
import {
  getAboutContent,
  getFaqItems,
  getGalleryItems,
  getOfferItems,
  getOfferSectionMeta,
  isAboutVisible,
  isFaqVisible,
  isGalleryVisible,
  isOfferVisible,
} from "../shared/section-data";

type Props = { siteConfig: SiteConfig; siteSlug: string };

export function BentoPage({ siteConfig, siteSlug }: Props) {
  const heroImage = siteConfig.images?.hero;
  const about = getAboutContent(siteConfig);
  const offerMeta = getOfferSectionMeta(siteConfig);
  const offers = getOfferItems(siteConfig);
  const gallery = getGalleryItems(siteConfig);
  const faqs = getFaqItems(siteConfig);

  return (
    <div id="top" className="pb-10">
      <TemplateTopBar
        siteConfig={siteConfig}
        maxWidthClassName="max-w-6xl"
        centerBrandOnMobile
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section
          aria-label="Predstavitev"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-stretch"
        >
          <div className="order-2 flex min-h-[21rem] flex-col justify-center gap-6 rounded-[var(--radius)] bg-[var(--surface)] p-5 sm:order-1 sm:min-h-[24rem] lg:min-h-[27rem] lg:p-8">
            <div className="space-y-3">
              <h1 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-[2.15rem]">
                {siteConfig.hero.title}{" "}
                <span className="text-[var(--accent)]">
                  {siteConfig.hero.titleHighlight}
                </span>
              </h1>
              <p className="max-w-prose text-base text-[var(--muted)]">
                {siteConfig.hero.description}
              </p>
            </div>
            <div>
              <PhoneCta siteConfig={siteConfig} />
            </div>
          </div>
          <div className="relative order-1 min-h-[21rem] overflow-hidden rounded-[var(--radius)] bg-[var(--surface)] sm:order-2 sm:min-h-[24rem] lg:min-h-[27rem]">
            {heroImage ? (
              <TemplateImage
                image={heroImage}
                priority
                className="absolute inset-0 h-full w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-end bg-[var(--accent)]/15 p-5">
                <p className="text-lg font-semibold">{siteConfig.hero.badge}</p>
              </div>
            )}
          </div>
        </section>

        {isAboutVisible(siteConfig) ? (
          <section id={about.id} className="mt-10 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-[var(--radius)] bg-[var(--surface)] p-5 lg:col-span-2 lg:p-7">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {about.title}
              </h2>
              <p className="mt-3 max-w-prose text-[var(--muted)]">
                {about.description}
              </p>
            </div>
            {about.points.length > 0 ? (
              <ul className="space-y-3">
                {about.points.map((point) => (
                  <li
                    key={point}
                    className="rounded-[var(--radius)] bg-[var(--surface)] px-4 py-3 text-sm font-medium"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {isOfferVisible(siteConfig) ? (
          <section id={offerMeta.id} className="mt-10">
            <div className="rounded-[var(--radius)] bg-[var(--surface)] p-5 sm:p-7">
              <p className="text-sm text-[var(--muted)]">{offerMeta.eyebrow}</p>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {offerMeta.title}
              </h2>
              {offerMeta.description ? (
                <p className="mt-2 max-w-prose text-[var(--muted)]">
                  {offerMeta.description}
                </p>
              ) : null}
              <ul className="mt-6 divide-y divide-[var(--border)]">
                {offers.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-baseline justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold">
                        {item.name}
                        {item.featured ? (
                          <span className="ml-2 text-xs font-medium text-[var(--accent)]">
                            priljubljeno
                          </span>
                        ) : null}
                      </p>
                      {item.description ? (
                        <p className="mt-0.5 text-sm font-normal text-[var(--muted)]">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    {item.price ? (
                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {item.price}
                        {item.unit ? (
                          <span className="font-normal text-[var(--muted)]">
                            {" "}
                            {item.unit}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              {offerMeta.disclaimer ? (
                <p className="mt-4 text-xs text-[var(--muted)]">
                  {offerMeta.disclaimer}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {isGalleryVisible(siteConfig) ? (
          <section id="galerija" className="mt-10">
            <p className="text-sm text-[var(--muted)]">
              {siteConfig.gallery?.eyebrow || "Galerija"}
            </p>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {siteConfig.gallery?.title || "Galerija"}
            </h2>
            <div className="mt-4">
              <TemplateGalleryCarousel items={gallery} frame="soft" />
            </div>
          </section>
        ) : null}

        {isFaqVisible(siteConfig) ? (
          <section id="faq" className="mt-10">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Pogosta vprašanja
            </h2>
            <div className="mt-4 space-y-3">
              {faqs.map((item) => (
                <details
                  key={item.question}
                  className="rounded-[var(--radius)] bg-[var(--surface)] px-4 py-3"
                >
                  <summary className="cursor-pointer font-semibold">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section
          id={siteConfig.contact.id}
          className="mt-10 mb-8 grid grid-cols-1 gap-3 lg:grid-cols-3"
        >
          <div className="rounded-[var(--radius)] bg-[var(--accent)] p-6 text-[var(--accent-foreground)] lg:col-span-2">
            <h2 className="text-xl font-bold tracking-tight">
              {siteConfig.contact.title}
            </h2>
            <p className="mt-2 opacity-90">{siteConfig.contact.description}</p>
            <div className="mt-6">
              <PhoneCta
                siteConfig={siteConfig}
                className="!bg-[var(--surface)] !text-[var(--foreground)]"
              />
            </div>
          </div>
          <div className="space-y-3 rounded-[var(--radius)] bg-[var(--surface)] p-6 text-sm">
            {getAddress(siteConfig) ? (
              <p>
                <span className="block text-[var(--muted)]">Naslov</span>
                {getAddress(siteConfig)}
              </p>
            ) : null}
            {getHours(siteConfig) ? (
              <p>
                <span className="block text-[var(--muted)]">Odpiralni čas</span>
                {getHours(siteConfig)}
              </p>
            ) : null}
            {getEmail(siteConfig) ? (
              <p>
                <span className="block text-[var(--muted)]">E-pošta</span>
                <a
                  href={
                    getEmail(siteConfig)!.href ||
                    `mailto:${getEmail(siteConfig)!.value}`
                  }
                >
                  {getEmail(siteConfig)!.value}
                </a>
              </p>
            ) : null}
          </div>
        </section>
      </main>

      <TemplateFooter
        siteConfig={siteConfig}
        siteSlug={siteSlug}
        maxWidthClassName="max-w-6xl"
      />
    </div>
  );
}
