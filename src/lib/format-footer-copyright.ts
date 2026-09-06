/**
 * Builds a single plain-text footer copyright line.
 * `rights` is rendered as React text (not HTML), so &copy; entities are
 * normalized to the Unicode © character.
 */
export function formatFooterCopyright(brandName: string, rights: string): string {
  const trimmed = rights.trim();
  const normalized = trimmed.replace(/&copy;/gi, "©");

  if (normalized.includes("©")) {
    return normalized;
  }

  return `© ${new Date().getFullYear()} ${brandName}. ${trimmed}`;
}
