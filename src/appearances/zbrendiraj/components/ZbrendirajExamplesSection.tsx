import Image from "next/image";
import Link from "next/link";
import { ZbrendirajSectionHeading } from "./ZbrendirajSectionHeading";
import {
  getHostname,
  ZbrendirajExamplePreview,
} from "./ZbrendirajExamplePreview";
import { zbBodyText, zbCard } from "../styles";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

function ExampleBrowserChrome({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-black px-4 py-3">
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="size-2 rounded-full bg-[#FF5F57]" />
        <span className="size-2 rounded-full bg-[#FEBC2E]" />
        <span className="size-2 rounded-full bg-[#28C840]" />
      </div>
      <div className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-[#111] px-3 py-1 text-[10px] text-[#9A9A9A]">
        {url}
      </div>
    </div>
  );
}

export function ZbrendirajExamplesSection({ siteConfig }: Props) {
  const { whyChooseUs } = siteConfig;

  return (
    <section
      id={whyChooseUs.id}
      className="bg-black px-4 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <ZbrendirajSectionHeading
          align="left"
          eyebrow={whyChooseUs.eyebrow}
          title={whyChooseUs.title}
          description={whyChooseUs.description}
        />

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {whyChooseUs.benefits.map((benefit) => {
            const previewUrl = benefit.href
              ? getHostname(benefit.href)
              : (benefit.image?.alt ?? `${benefit.title?.toLowerCase()}.si`);

            const card = (
              <article
                className={`group overflow-hidden ${zbCard} hover:border-accent/50`}
              >
                <ExampleBrowserChrome url={previewUrl} />
                {benefit.href ? (
                  <ZbrendirajExamplePreview
                    href={benefit.href}
                    title={benefit.title ?? benefit.label}
                  />
                ) : benefit.image ? (
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#111]">
                    <Image
                      src={benefit.image.src}
                      alt={benefit.image.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                ) : null}
                <div className="p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                    {benefit.label}
                  </p>
                  {benefit.title ? (
                    <p className="font-display mt-2 text-2xl text-white">
                      {benefit.title}
                    </p>
                  ) : null}
                  {benefit.description ? (
                    <p className={`mt-3 ${zbBodyText}`}>{benefit.description}</p>
                  ) : null}
                  {benefit.href ? (
                    <p className="mt-4 text-sm font-medium text-accent">
                      Odpri predogled →
                    </p>
                  ) : null}
                </div>
              </article>
            );

            if (benefit.href) {
              return (
                <Link
                  key={benefit.title ?? benefit.label}
                  href={benefit.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {card}
                </Link>
              );
            }

            return <div key={benefit.title ?? benefit.label}>{card}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
