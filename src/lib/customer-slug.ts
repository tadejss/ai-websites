/**
 * Canonical customer slug format used by site generation and publish tooling.
 * Reject anything outside this charset — never normalize malicious input.
 */
export const CUSTOMER_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const CUSTOMER_SLUG_MAX_LENGTH = 64;

export function isValidCustomerSlug(slug: string | null | undefined): boolean {
  if (typeof slug !== "string") {
    return false;
  }

  if (slug.length === 0 || slug.length > CUSTOMER_SLUG_MAX_LENGTH) {
    return false;
  }

  // Reject whitespace / control chars before the charset check (defense in depth).
  if (/[\s\0\\/"'`$();|&<>]/.test(slug)) {
    return false;
  }

  return CUSTOMER_SLUG_PATTERN.test(slug);
}
