/**
 * Builds a single plain-text footer copyright line.
 * `rights` is rendered as React text (not HTML), so &copy; entities are
 * normalized to the Unicode © character.
 *
 * Some demos store company identity inside `rights` without a © marker
 * (e.g. "Podjetje X s.p. Vse pravice pridržane."). In that case we only
 * prefix © + year — we do not prepend `brandName` again.
 */
export function formatFooterCopyright(brandName: string, rights: string): string {
  const trimmed = rights.trim();
  const normalized = trimmed.replace(/&copy;/gi, "©");
  const year = new Date().getFullYear();

  if (normalized.includes("©")) {
    return normalized;
  }

  const brand = brandName.trim();
  const rightsLower = normalized.toLocaleLowerCase("sl");
  const brandLower = brand.toLocaleLowerCase("sl");
  const brandAlreadyPresent =
    Boolean(brandLower) && rightsLower.includes(brandLower);
  // Named copyright without © — common on older trade demos.
  const looksLikeNamedCopyright = !/^vse pravice\b/i.test(normalized);

  if (brandAlreadyPresent || looksLikeNamedCopyright) {
    return `© ${year} ${normalized}`;
  }

  return `© ${year} ${brand}. ${normalized}`;
}
