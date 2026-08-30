/**
 * Short business name for SMS personalization only.
 * Does not mutate lead JSON or DB — display-time only.
 */
const LEGAL_FORM =
  /\b(?:s\.?\s*p\.?|d\.?\s*o\.?\s*o\.?|d\.?\s*n\.?\s*o\.?|d\.?\s*d\.?|k\.?\s*d\.?|z\.?\s*o\.?\s*o\.?)\s*$/i;

function hasLegalForm(value: string): boolean {
  return LEGAL_FORM.test(value.trim());
}

function stripTrailingLegalForm(value: string): string {
  return value.replace(LEGAL_FORM, "").replace(/[,\s]+$/g, "").trim();
}

/**
 * Prefer the trading/brand name over a full legal style like
 * "Bb elektro instalacije, Boštjan Bole s.p.".
 */
export function smsCompanyDisplayName(
  raw: string | null | undefined,
  fallback = "",
): string {
  let name = raw?.trim() ?? "";
  if (!name) {
    return fallback;
  }

  const commaIndex = name.indexOf(",");
  if (commaIndex > 0) {
    const afterComma = name.slice(commaIndex + 1).trim();
    // Only split when the tail looks like a person + legal form (or legal form alone).
    if (hasLegalForm(afterComma)) {
      name = name.slice(0, commaIndex).trim();
    }
  }

  name = stripTrailingLegalForm(name);
  return name || fallback;
}
