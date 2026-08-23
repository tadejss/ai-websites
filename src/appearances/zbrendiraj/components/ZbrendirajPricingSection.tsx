import { StripePricingTable } from "@/billing/StripePricingTable";
import { zbBodyText, zbSectionEyebrow } from "../styles";

const DEFAULT_PRICING_TABLE_ID = "prctbl_1U7U51Ga3w4RPcywbC2yHWgr";
const DEFAULT_PUBLISHABLE_KEY =
  "pk_test_51U6rcRGa3w4RPcywDO5OOuo3ELmCjZnwgbKeWdrxr3h4rgKE8cdU8rfMMKueixWM4LVK0d3cmiM6eSxcBTmLRobj00BRkBAePf";

export function ZbrendirajPricingSection() {
  const pricingTableId =
    process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID?.trim() ||
    DEFAULT_PRICING_TABLE_ID;
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    DEFAULT_PUBLISHABLE_KEY;

  return (
    <section id="cenik" className="bg-black px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className={zbSectionEyebrow}>Cenik</p>
          <h2 className="font-display mt-5 text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            Preprosta cena. Brez velikih začetnih stroškov.
          </h2>
          <p className={`mx-auto mt-6 max-w-2xl ${zbBodyText} sm:text-lg`}>
            Profesionalna spletna stran za tvoj biznis v obliki preproste
            naročnine.
          </p>
        </div>

        <div className="mt-14 sm:mt-16">
          <StripePricingTable
            pricingTableId={pricingTableId}
            publishableKey={publishableKey}
          />
        </div>

        <p className={`mx-auto mt-10 max-w-2xl text-center ${zbBodyText}`}>
          Posodabljanje vsebine je vključeno. Večje funkcionalne nadgradnje in
          razširitve strani so možne proti doplačilu. Domena je vključena pri
          letni naročnini.
        </p>
      </div>
    </section>
  );
}
