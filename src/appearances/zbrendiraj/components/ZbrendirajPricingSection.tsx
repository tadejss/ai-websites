import { StripePricingTable } from "@/billing/StripePricingTable";
import { zbBodyText, zbSectionEyebrow } from "../styles";

const DEFAULT_PRICING_TABLE_ID = "prctbl_1U99qhGsdWtwcxsI3crFnvPp";
const DEFAULT_PUBLISHABLE_KEY =
  "pk_live_51Qsj45GsdWtwcxsIISWvHBx30LulKS6z5fc0OXu5DLVBrWeZvdswYxIPSRFrfsBS87LnLRCYV0UuI7odTYXCG7io00Qix0E56P";

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

        <p className="mx-auto mt-10 max-w-2xl text-center text-[11px] italic leading-relaxed text-[#D0D0D0] sm:text-xs">
          Posodabljanje vsebine je vključeno. Večje funkcionalne nadgradnje in
          razširitve strani so možne proti doplačilu. Pri letni naročnini je
          domena vključena (gratis). Navedene cene vključujejo 22 % DDV.
        </p>
      </div>
    </section>
  );
}
