import type { SiteConfig } from "@/content/types/site";
import { PhoneCta } from "../shared/PhoneCta";
import { TemplateBenefitsSection } from "../shared/TemplateBenefitsSection";
import { TemplateFinalCtaSection } from "../shared/TemplateFinalCtaSection";
import { TemplateFooter } from "../shared/TemplateFooter";
import { TemplateGalleryCarousel } from "../shared/TemplateGalleryCarousel";
import { TemplateImage } from "../shared/TemplateImage";
import { TemplateProcessSection } from "../shared/TemplateProcessSection";
import { TemplateServiceAreaSection } from "../shared/TemplateServiceAreaSection";
import { TemplateTopBar } from "../shared/TemplateTopBar";
import { getAddress, getEmail, getHours } from "../shared/contact-data";
import {
  getAboutContent,
  getBenefitsContent,
  getFaqItems,
  getFinalCtaContent,
  getGalleryItems,
  getOfferItems,
  getOfferSectionMeta,
  getProcessContent,
  getServiceAreaContent,
  isAboutVisible,
  isBenefitsVisible,
  isFaqVisible,
  isFinalCtaVisible,
  isGalleryVisible,
  isOfferVisible,
  isProcessVisible,
  isServiceAreaVisible,
} from "../shared/section-data";

type Props = { siteConfig: SiteConfig; siteSlug: string };

/** Floating Minimalism — calm, but tighter rhythm (not overstretched). */
export function FloatingPage({ siteConfig, siteSlug }: Props) {
  const heroImage = siteConfig.images?.hero;
  const about = getAboutContent(siteConfig);
  const benefits = getBenefitsContent(siteConfig);
  const offerMeta = getOfferSectionMeta(siteConfig);
  const offers = getOfferItems(siteConfig);
  const process = getProcessContent(siteConfig);
  const gallery = getGalleryItems(siteConfig);
  const serviceArea = getServiceAreaContent(siteConfig);
  const faqs = getFaqItems(siteConfig);
  const finalCta = getFinalCtaContent(siteConfig);

  return (
    <div
      id="top"
      className="pb-12 [&_header_a.min-w-0]:text-lg [&_header_a.min-w-0]:font-extrabold sm:[&_header_a.min-w-0]:text-xl"
    >
      <TemplateTopBar
        siteConfig={siteConfig}
        maxWidthClassName="max-w-5xl"
        className="bg-transparent"
        contentClassName="px-4 py-3 sm:px-8"
      />

      <main className="mx-auto max-w-5xl px-4 sm:px-8">
        <section className="relative grid grid-cols-1 items-start gap-8 pt-4 lg:grid-cols-12 lg:items-center lg:gap-10 lg:pt-6">
          <div className="order-2 space-y-4 lg:order-1 lg:col-span-5 lg:pt-0">
            <h1 className="font-display text-xl font-extrabold leading-[1.15] tracking-tight sm:text-2xl lg:text-[1.85rem]">
              {siteConfig.hero.title}{" "}
              <em className="not-italic text-[var(--accent)]">
                {siteConfig.hero.titleHighlight}
              </em>
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              {siteConfig.hero.description}
            </p>
            <PhoneCta
              siteConfig={siteConfig}
              className="!rounded-full !px-6 !text-sm !font-extrabold"
            />
          </div>
          <div className="order-1 lg:order-2 lg:col-span-7 lg:pl-2">
            {heroImage ? (
              <TemplateImage
                image={heroImage}
                priority
                className="aspect-[5/4] max-h-[22rem] w-full rounded-[var(--radius)] object-cover sm:max-h-none sm:aspect-[8/15] lg:aspect-[4/5] lg:max-h-[34rem] lg:translate-x-0"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            ) : (
              <div className="aspect-[5/4] max-h-[22rem] rounded-[var(--radius)] bg-[var(--surface)] sm:max-h-none sm:aspect-[8/15] lg:aspect-[4/5] lg:max-h-[34rem]" />
            )}
          </div>
        </section>

        {isAboutVisible(siteConfig) ? (
          <section id={about.id} className="mt-16 max-w-2xl sm:mt-20">
            <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              {about.title}
            </h2>
            <p className="mt-3 text-[var(--muted)]">{about.description}</p>
            {about.points.length > 0 ? (
              <ul className="mt-8 space-y-4">
                {about.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-baseline gap-4"
                  >
                    <span
                      aria-hidden
                      className="shrink-0 font-display text-sm font-extrabold text-[var(--accent)]"
                    >
                      ✓
                    </span>
                    <p className="text-sm font-extrabold leading-snug tracking-tight text-[var(--foreground)] sm:text-base">
                      {point}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {isBenefitsVisible(siteConfig) ? (
          <TemplateBenefitsSection
            variant="floating"
            id={benefits.id}
            eyebrow={benefits.eyebrow}
            title={benefits.title}
            description={benefits.description}
            items={benefits.items}
          />
        ) : null}

        {isOfferVisible(siteConfig) ? (
          <section id={offerMeta.id} className="mt-16 sm:mt-20">
            <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              {offerMeta.title}
            </h2>
            <div className="mt-8 space-y-6">
              {offers.map((item) => (
                <article
                  key={item.name}
                  className="flex items-baseline justify-between gap-4 border-b border-[var(--accent)] pb-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold tracking-tight sm:text-base">
                      {item.name}
                    </p>
                    {item.description ? (
                      <p className="mt-1 text-sm font-normal leading-relaxed text-[var(--muted)]">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  {item.price ? (
                    <p className="shrink-0 text-sm font-extrabold tabular-nums">
                      {item.price}
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

        {isFinalCtaVisible(siteConfig) ? (
          <TemplateFinalCtaSection
            variant="floating"
            id={finalCta.id}
            title={finalCta.title}
            description={finalCta.description}
            siteConfig={siteConfig}
          />
        ) : null}

        {isProcessVisible(siteConfig) ? (
          <TemplateProcessSection
            variant="floating"
            id={process.id}
            eyebrow={process.eyebrow}
            title={process.title}
            description={process.description}
            steps={process.steps}
          />
        ) : null}

        {isGalleryVisible(siteConfig) ? (
          <section id="galerija" className="mt-16 sm:mt-20">
            <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              {siteConfig.gallery?.title || "Galerija"}
            </h2>
            <div className="mt-8">
              <TemplateGalleryCarousel items={gallery} frame="soft" />
            </div>
          </section>
        ) : null}

        {isServiceAreaVisible(siteConfig) && serviceArea ? (
          <TemplateServiceAreaSection
            variant="floating"
            id={serviceArea.id}
            eyebrow={serviceArea.eyebrow}
            title={serviceArea.title}
            description={serviceArea.description}
          />
        ) : null}

        {isFaqVisible(siteConfig) ? (
          <section id="faq" className="mt-16 sm:mt-20">
            <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              Pogosta vprašanja
            </h2>
            <ul className="mt-8 divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {faqs.map((item) => (
                <li key={item.question} className="py-4">
                  <p className="text-sm font-extrabold text-[var(--accent)] sm:text-base">
                    {item.question}
                  </p>
                  <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
                    {item.answer}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id={siteConfig.contact.id} className="mt-16 mb-12 max-w-lg sm:mt-20">
          <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
            {siteConfig.contact.title}
          </h2>
          <p className="mt-3 text-[var(--muted)]">
            {siteConfig.contact.description}
          </p>
          <div className="mt-6">
            <PhoneCta
              siteConfig={siteConfig}
              className="!rounded-full !text-sm !font-extrabold"
            />
          </div>
          <div className="mt-6 space-y-2 text-sm text-[var(--muted)]">
            {getAddress(siteConfig) ? <p>{getAddress(siteConfig)}</p> : null}
            {getHours(siteConfig) ? <p>{getHours(siteConfig)}</p> : null}
            {getEmail(siteConfig) ? (
              <p>
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
        contentClassName="px-4 sm:px-8"
      />
    </div>
  );
}
