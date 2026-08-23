import Image from "next/image";
import Link from "next/link";
import { ZbrendirajSectionHeading } from "./ZbrendirajSectionHeading";
import { ZbrendirajExamplePreview } from "./ZbrendirajExamplePreview";
import { zbCard } from "../styles";
import type { Benefit, SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

function ExampleCard({ benefit }: { benefit: Benefit }) {
  const title = benefit.title ?? benefit.label;

  return (
    <article
      className={`group h-full overflow-hidden ${zbCard} hover:border-accent/50`}
    >
      {benefit.href ? (
        <ZbrendirajExamplePreview href={benefit.href} title={title} />
      ) : benefit.image ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-[#111]">
          <Image
            src={benefit.image.src}
            alt={benefit.image.alt}
            fill
            sizes="(max-width: 768px) 85vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}
      <div className="p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          {benefit.label}
        </p>
        {benefit.title ? (
          <p className="font-display mt-2 text-xl text-white sm:text-2xl">
            {benefit.title}
          </p>
        ) : null}
        {benefit.href ? (
          <p className="mt-4 text-sm font-medium text-accent">
            Odpri predogled →
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ZbrendirajExamplesSection({ siteConfig }: Props) {
  const { whyChooseUs } = siteConfig;

  return (
    <section
      id={whyChooseUs.id}
      className="bg-black py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-0">
        <ZbrendirajSectionHeading
          align="left"
          eyebrow={whyChooseUs.eyebrow}
          title={whyChooseUs.title}
          description={whyChooseUs.description}
        />
      </div>

      <div
        className="mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-6 md:mx-auto md:grid md:max-w-7xl md:grid-cols-2 md:gap-6 md:overflow-visible md:px-6 md:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden"
        aria-label="Primeri spletnih strani"
      >
        {whyChooseUs.benefits.map((benefit) => {
          const key = benefit.title ?? benefit.label;
          const slideClassName =
            "w-[85%] max-w-sm shrink-0 snap-center md:w-auto md:max-w-none md:shrink md:snap-none";

          if (benefit.href) {
            return (
              <Link
                key={key}
                href={benefit.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`block ${slideClassName}`}
              >
                <ExampleCard benefit={benefit} />
              </Link>
            );
          }

          return (
            <div key={key} className={slideClassName}>
              <ExampleCard benefit={benefit} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
