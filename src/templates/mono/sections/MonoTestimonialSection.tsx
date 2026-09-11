import Image from "next/image";
import type { SiteConfig } from "@/content/types/site";
import { getAboutContent } from "../../shared/section-data";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoTestimonialSection({ siteConfig }: Props) {
  const about = getAboutContent(siteConfig);
  const quote =
    about.description ||
    siteConfig.hero.description ||
    "Pasivna hiša, ki združuje sodoben dizajn s spoštovanjem do narave — ustvarjena za tiste, ki nočejo izbirati med sodobnim udobjem in ekološko odgovornostjo.";

  return (
    <section id="o-nas" className="bg-[var(--background)]">
      <div className="relative aspect-[16/9] w-full min-h-[420px]">
        <Image
          src="/templates/mono/testimonial-house.png"
          alt="Sodobna corten jeklena arhitektura v naravnem ambientu"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-end justify-center px-6 pb-16 md:px-12 md:pb-24 lg:px-20 lg:pb-32">
          <p className="mx-auto max-w-5xl text-2xl font-light leading-relaxed text-white drop-shadow-md md:text-3xl lg:text-[2.25rem] lg:leading-snug text-center">
            {quote}
          </p>
        </div>
      </div>
    </section>
  );
}
