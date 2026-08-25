import { ZbrendirajButton } from "./ZbrendirajButton";
import { zbBodyText, zbSectionEyebrow } from "../styles";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function ZbrendirajConversionSection({ siteConfig }: Props) {
  const { nav } = siteConfig;

  return (
    <section
      id="zacni-danes"
      className="bg-black px-4 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className={zbSectionEyebrow}>Začni danes</p>
        <h2 className="font-display mt-6 text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
          Tvoj biznis si zasluži več kot Instagram profil.
        </h2>
        <p className={`mx-auto mt-6 max-w-xl ${zbBodyText}`}>
          Postavi ga online tako, kot si zasluži — profesionalno, jasno in
          pripravljeno za tvoje stranke.
        </p>
        <div className="mt-10 flex justify-center">
          <ZbrendirajButton href="#cenik" className="px-8">
            {nav.cta}
          </ZbrendirajButton>
        </div>
      </div>
    </section>
  );
}
