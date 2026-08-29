/**
 * Seller identity for Stripe invoice footers / docs.
 * Account tax ID and legal name on PDFs still come primarily from
 * Stripe Dashboard (Business details + Invoice tax information).
 */
export const SELLER_LEGAL = {
  legalName: "DETAJL, Tadej Šarabon Štojs s.p.",
  brandName: "Zbrendiraj.si",
  vatId: "SI95610359",
  addressLine: "Langusova ulica 28, 4240 Radovljica",
} as const;

export function sellerInvoiceFooter(): string {
  return [
    SELLER_LEGAL.legalName,
    `ID za DDV: ${SELLER_LEGAL.vatId}`,
    SELLER_LEGAL.addressLine,
    SELLER_LEGAL.brandName,
  ].join(" · ");
}
