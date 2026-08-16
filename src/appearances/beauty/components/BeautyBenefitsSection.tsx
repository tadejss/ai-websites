import Image from "next/image";
import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatCardTitle } from "../utils/format-card-title";
import { BeautyBrowserFrame } from "./BeautyBrowserFrame";
import { BeautyExamplePreview } from "./BeautyExamplePreview";
import type { Benefit, SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

function hasVisualExamples(benefits: Benefit[]): boolean {
  return benefits.some((benefit) => benefit.variant || benefit.image);
}

export function BeautyBenefitsSection({ siteConfig }: Props) {
  const { whyChooseUs } = siteConfig;

  if (hasVisualExamples(whyChooseUs.benefits)) {
    return (
      <section className="bg-background px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div id={whyChooseUs.id}>
            <SectionHeading
              variant="beauty"
              eyebrow={whyChooseUs.eyebrow}
              title={whyChooseUs.title}
              description={whyChooseUs.description}
            />

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {whyChooseUs.benefits.map((benefit) => (
                <article
                  key={benefit.title ?? benefit.label}
                  className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface"
                >
                  {benefit.image ? (
                    <BeautyBrowserFrame
                      url={benefit.image.alt}
                      className="border-0 shadow-none"
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={benefit.image.src}
                          alt={benefit.image.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    </BeautyBrowserFrame>
                  ) : benefit.variant ? (
                    <BeautyBrowserFrame
                      url={`${benefit.title?.toLowerCase().replace(/\s+/g, "-") ?? "primer"}.si`}
                      className="border-0 shadow-none"
                    >
                      <BeautyExamplePreview
                        title={benefit.title ?? benefit.label}
                        label={benefit.label}
                        variant={benefit.variant}
                      />
                    </BeautyBrowserFrame>
                  ) : null}

                  <div className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                      {benefit.label}
                    </p>
                    {benefit.title ? (
                      <p className="font-display mt-1 text-xl text-foreground">
                        {benefit.title}
                      </p>
                    ) : null}
                    {benefit.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {benefit.description}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {whyChooseUs.steps ? (
            <div
              id={whyChooseUs.steps.id}
              className="mt-24 border-t border-border pt-24"
            >
              <SectionHeading
                variant="beauty"
                align="left"
                eyebrow={whyChooseUs.steps.eyebrow}
                title={whyChooseUs.steps.title}
              />

              <div className="mt-12 grid gap-8 md:grid-cols-3">
                {whyChooseUs.steps.items.map((item, index) => (
                  <article key={item} className="relative">
                    <p className="font-display text-5xl leading-none text-accent/30">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-4 text-base leading-relaxed text-foreground">
                      {item}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      id={whyChooseUs.id}
      className="bg-background px-4 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              variant="beauty"
              align="left"
              eyebrow={whyChooseUs.eyebrow}
              title={whyChooseUs.title}
              description={whyChooseUs.description}
            />

            <ul className="mt-12 space-y-5">
              {whyChooseUs.highlights.map((item) => (
                <li key={item} className="flex items-start gap-4 text-foreground">
                  <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-accent/15 bg-surface text-accent">
                    <Icon name="check" />
                  </span>
                  <span className="text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {whyChooseUs.benefits.map((benefit) => (
              <article
                key={formatCardTitle(benefit)}
                className="rounded-[var(--radius-card)] bg-accent p-7 text-accent-foreground sm:p-9"
              >
                <p className="font-display text-3xl leading-tight sm:text-4xl">
                  {formatCardTitle(benefit)}
                </p>
                {benefit.description ? (
                  <p className="mt-4 text-sm leading-relaxed text-accent-foreground/75 sm:text-base">
                    {benefit.description}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
