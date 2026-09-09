import type { SiteConfig } from "@/content/types/site";
import { PhoneCta } from "../shared/PhoneCta";
import { TemplateImage } from "../shared/TemplateImage";
import { TemplateTopBar } from "../shared/TemplateTopBar";
import { TemplateFooter } from "../shared/TemplateFooter";
import { TemplateGalleryCarousel } from "../shared/TemplateGalleryCarousel";
import {
  getAddress,
  getEmail,
  getHours,
  getPhoneHref,
  getPhoneLabel,
} from "../shared/contact-data";
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

/** Type Minimalism — type-led, restrained scale (not oversized). */
export function TypePage({ siteConfig, siteSlug }: Props) {
  const heroImage = siteConfig.images?.hero;
  const phoneHref = getPhoneHref(siteConfig);
  const phone = getPhoneLabel(siteConfig);
  const about = getAboutContent(siteConfig);
  const offerMeta = getOfferSectionMeta(siteConfig);
  const offers = getOfferItems(siteConfig);
  const gallery = getGalleryItems(siteConfig);
  const faqs = getFaqItems(siteConfig);

  return (
    <div
      id="top"
      className="min-h-full [&_header_a]:font-extrabold"
    >
      <TemplateTopBar
        siteConfig={siteConfig}
        showHeaderPhone
        maxWidthClassName="max-w-5xl"
        contentClassName="px-4 py-4 sm:px-8 lg:px-12"
      />

      <main className="mx-auto max-w-5xl px-4 sm:px-8 lg:px-12">
        <section className="grid grid-cols-1 gap-8 pt-4 lg:grid-cols-12 lg:items-center lg:gap-10 lg:pt-8">
          <div className="lg:col-span-7">
            <h1 className="font-display text-[clamp(1.55rem,5.5vw,2.6rem)] font-extrabold leading-[1.08] tracking-[-0.02em] lg:text-[2.35rem]">
              {siteConfig.hero.title}
              {siteConfig.hero.titleHighlight ? (
                <>
                  {" "}
                  <span className="text-[var(--accent)]">
                    {siteConfig.hero.titleHighlight}
                  </span>
                </>
              ) : null}
            </h1>
            <p className="mt-4 max-w-md text-base text-[var(--muted)]">
              {siteConfig.hero.description}
            </p>
            <div className="mt-6">
              <PhoneCta
                siteConfig={siteConfig}
                className="!rounded-none !bg-[var(--accent)] !px-5 !py-3 !text-[var(--accent-foreground)] !font-extrabold"
              />
            </div>
          </div>
          {heroImage ? (
            <div className="lg:col-span-5">
              <TemplateImage
                image={heroImage}
                priority
                className="aspect-[4/5] w-full object-cover lg:aspect-[5/6]"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          ) : null}
        </section>

        {isAboutVisible(siteConfig) ? (
          <section id={about.id} className="mt-16 border-t border-[var(--border)] pt-10 sm:mt-20">
            <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              {about.title}
            </h2>
            <p className="mt-3 max-w-xl text-[var(--muted)]">{about.description}</p>
            {about.points.length > 0 ? (
              <ul className="mt-8 grid grid-cols-3 gap-3 sm:gap-6">
                {about.points.map((point) => (
                  <li key={point} className="min-w-0">
                    <span
                      aria-hidden
                      className="font-display text-lg font-extrabold text-[var(--accent)] sm:text-2xl"
                    >
                      ✓
                    </span>
                    <p className="mt-2 text-xs font-extrabold leading-snug tracking-tight sm:mt-3 sm:text-sm">
                      {point}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {isOfferVisible(siteConfig) ? (
          <section id={offerMeta.id} className="mt-16 sm:mt-20">
            <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              {offerMeta.title}
            </h2>
            <ul className="mt-8 divide-y divide-[var(--accent)] border-y border-[var(--accent)]">
              {offers.map((item, index) => (
                <li
                  key={item.name}
                  className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 py-4 sm:gap-6"
                >
                  <span className="font-display text-lg font-extrabold tabular-nums text-[var(--accent)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold sm:text-lg">
                      {item.name}
                    </h3>
                    {item.description ? (
                      <p className="mt-1 text-sm font-normal leading-relaxed text-[var(--muted)]">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  {item.price ? (
                    <p className="text-sm font-extrabold tabular-nums text-[var(--accent)]">
                      {item.price}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {offerMeta.disclaimer ? (
              <p className="mt-4 text-sm text-[var(--muted)]">
                {offerMeta.disclaimer}
              </p>
            ) : null}
          </section>
        ) : null}

        {isGalleryVisible(siteConfig) ? (
          <section id="galerija" className="mt-16 sm:mt-20">
            <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              {siteConfig.gallery?.title || "Galerija"}
            </h2>
            <div className="mt-8">
              <TemplateGalleryCarousel items={gallery} frame="sharp" />
            </div>
          </section>
        ) : null}

        {isFaqVisible(siteConfig) ? (
          <section id="faq" className="mt-16 sm:mt-20">
            <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              Pogosta vprašanja
            </h2>
            <ul className="mt-8 divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {faqs.map((item) => (
                <li key={item.question} className="py-4">
                  <p className="font-extrabold text-[var(--accent)]">{item.question}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.answer}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id={siteConfig.contact.id} className="mt-16 mb-16 sm:mt-20">
          <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
            {siteConfig.contact.title}
          </h2>
          <p className="mt-3 max-w-md text-[var(--muted)]">
            {siteConfig.contact.description}
          </p>
          {phoneHref && phone ? (
            <a
              href={phoneHref}
              className="mt-6 inline-block font-display text-xl font-extrabold tracking-tight text-[var(--accent)] underline-offset-4 hover:underline sm:text-2xl"
            >
              {phone}
            </a>
          ) : null}
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
        contentClassName="px-4 sm:px-8 lg:px-12"
      />
    </div>
  );
}
