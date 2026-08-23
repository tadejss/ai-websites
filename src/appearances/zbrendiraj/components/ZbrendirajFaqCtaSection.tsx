import Link from "next/link";
import { ZbrendirajButton } from "./ZbrendirajButton";
import { zbBodyText, zbSectionEyebrow } from "../styles";

type Props = {
  siteSlug: string;
};

export function ZbrendirajFaqCtaSection({ siteSlug }: Props) {
  return (
    <section
      id="vprasanja"
      className="bg-black px-4 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16">
          <div>
            <p className={zbSectionEyebrow}>Pogosta vprašanja</p>
            <h2 className="font-display mt-5 text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Imaš vprašanje pred nakupom?
            </h2>
            <p className={`mt-6 max-w-xl ${zbBodyText}`}>
              Brez skrbi. Zbrendiraj.si je namenjen tudi tistim, ki se s spletnimi
              stranmi ne želijo ukvarjati sami. Poskrbimo za tehnični del, ti pa
              nam poveš nekaj osnovnih informacij o svojem biznisu.
            </p>
          </div>

          <div className="flex lg:justify-end">
            <ZbrendirajButton href={`/${siteSlug}/pogosta-vprasanja`}>
              Pogosta vprašanja
            </ZbrendirajButton>
          </div>
        </div>

        <p className="mt-8 text-sm text-[#9A9A9A]">
          Ali piši na{" "}
          <Link
            href="mailto:info@zbrendiraj.si"
            className="text-accent transition-colors hover:text-white"
          >
            info@zbrendiraj.si
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
