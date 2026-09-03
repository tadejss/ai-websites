/** Normalize a domain string from onboarding or admin input. */
export function normalizeDomain(input: string | null | undefined): string | null {
  if (!input?.trim()) {
    return null;
  }

  let value = input.trim().toLowerCase();

  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/\/.*$/, "");
  value = value.replace(/^www\./, "");
  value = value.replace(/\.$/, "");

  if (!value.includes(".") || value.includes(" ") || value.includes("@")) {
    return null;
  }

  return value;
}

export function buildEmailAddress(domain: string, localPart: string): string {
  return `${localPart}@${domain}`;
}
