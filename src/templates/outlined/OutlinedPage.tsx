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

export function OutlinedPage({ siteConfig, siteSlug }: Props) {
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
        maxWidthClassName="max-w-5xl"
        centerBrandOnMobile
        contentClassName="border-b-2 border-[var(--border)] px-4 py-3 sm:px-6"
      />

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="relative mt-6 grid grid-cols-1 gap-6 lg:mt-10 lg:grid-cols-12 lg:gap-0">
          <div className="relative z-10 border-2 border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 lg:col-span-7 lg:mt-16 lg:-mr-8">
            <h1 className="text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl">
              {siteConfig.hero.title}{" "}
              <span className="text-[var(--accent)]">
                {siteConfig.hero.titleHighlight}
              </span>
            </h1>
            <p className="mt-4 max-w-md text-base text-[var(--muted)]">
              {siteConfig.hero.description}
            </p>
            <div className="mt-8">
              <PhoneCta
                siteConfig={siteConfig}
                className="!border-[var(--accent)] !bg-[var(--accent)] !text-white"
              />
            </div>
          </div>
          <div className="relative lg:col-span-5 lg:pl-4">
            <div className="border-2 border-[var(--border)] bg-[var(--accent)]/10 p-2 lg:translate-y-4">
              {heroImage ? (
                <TemplateImage
                  image={heroImage}
                  priority
                  className="aspect-[4/5] w-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              ) : (
                <div className="flex aspect-[4/5] items-end border-2 border-[var(--border)] bg-[var(--surface)] p-4 font-bold">
                  {siteConfig.hero.badge}
                </div>
              )}
            </div>
          </div>
        </section>

        {isAboutVisible(siteConfig) ? (
          <section
            id={about.id}
            className="mt-14 border-2 border-[var(--border)] bg-[var(--surface)] p-6 sm:mt-16 sm:p-8"
          >
            <h2 className="text-2xl font-bold tracking-tight">{about.title}</h2>
            <p className="mt-3 max-w-2xl text-[var(--muted)]">{about.description}</p>
            {about.points.length > 0 ? (
              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {about.points.map((point, index) => (
                  <li
                    key={point}
                    className="border-2 border-[var(--accent)] bg-[color-mix(in_srgb,var(--background)_50%,var(--surface)_50%)] p-4 text-sm font-semibold"
                  >
                    <span className="text-[var(--accent)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-2">{point}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {isOfferVisible(siteConfig) ? (
          <section id={offerMeta.id} className="mt-14 sm:mt-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">
              {offerMeta.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {offerMeta.title}
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {offers.map((item) => (
                <article
                  key={item.name}
                  className={`border-2 bg-[var(--surface)] p-5 ${
                    item.featured
                      ? "border-[var(--accent)] shadow-[4px_4px_0_var(--accent)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold leading-snug">
                      {item.name}
                    </h3>
                    {item.price ? (
                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {item.price}
                      </p>
                    ) : null}
                  </div>
                  {item.description ? (
                    <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted)]">
                      {item.description}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
            {offerMeta.disclaimer ? (
              <p className="mt-4 text-xs text-[var(--muted)]">
                {offerMeta.disclaimer}
              </p>
            ) : null}
          </section>
        ) : null}

        {isGalleryVisible(siteConfig) ? (
          <section id="galerija" className="mt-14 sm:mt-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">
              {siteConfig.gallery?.eyebrow || "Galerija"}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {siteConfig.gallery?.title || "Galerija"}
            </h2>
            <div className="mt-8">
              <TemplateGalleryCarousel items={gallery} frame="outline" />
            </div>
          </section>
        ) : null}

        {isFaqVisible(siteConfig) ? (
          <section id="faq" className="mt-14 sm:mt-16">
            <h2 className="text-2xl font-bold tracking-tight">
              Pogosta vprašanja
            </h2>
            <div className="mt-6 space-y-3">
              {faqs.map((item) => (
                <details
                  key={item.question}
                  className="border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                >
                  <summary className="cursor-pointer font-bold text-[var(--accent)]">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section id={siteConfig.contact.id} className="mt-14 mb-10 sm:mt-16">
          <div className="border-2 border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">
              {siteConfig.contact.title}
            </h2>
            <p className="mt-2 max-w-lg text-[var(--muted)]">
              {siteConfig.contact.description}
            </p>
            <div className="mt-6">
              <PhoneCta siteConfig={siteConfig} />
            </div>
            <dl className="mt-8 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              {getAddress(siteConfig) ? (
                <div>
                  <dt className="font-bold">Naslov</dt>
                  <dd className="mt-1 text-[var(--muted)]">
                    {getAddress(siteConfig)}
                  </dd>
                </div>
              ) : null}
              {getHours(siteConfig) ? (
                <div>
                  <dt className="font-bold">Odpiralni čas</dt>
                  <dd className="mt-1 text-[var(--muted)]">
                    {getHours(siteConfig)}
                  </dd>
                </div>
              ) : null}
              {getEmail(siteConfig) ? (
                <div>
                  <dt className="font-bold">E-pošta</dt>
                  <dd className="mt-1">
                    <a
                      className="text-[var(--muted)] underline"
                      href={
                        getEmail(siteConfig)!.href ||
                        `mailto:${getEmail(siteConfig)!.value}`
                      }
                    >
                      {getEmail(siteConfig)!.value}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>
      </main>

      <TemplateFooter siteConfig={siteConfig} siteSlug={siteSlug} />
    </div>
  );
}
