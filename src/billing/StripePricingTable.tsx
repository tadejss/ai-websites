"use client";

import { createElement } from "react";
import Script from "next/script";

type Props = {
  pricingTableId: string;
  publishableKey: string;
};

export function StripePricingTable({ pricingTableId, publishableKey }: Props) {
  return (
    <div className="w-full min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]">
      <Script
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="lazyOnload"
      />
      {createElement("stripe-pricing-table", {
        "pricing-table-id": pricingTableId,
        "publishable-key": publishableKey,
      })}
    </div>
  );
}
