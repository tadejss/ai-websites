const SI_MOBILE_PREFIXES = new Set([
  "30",
  "31",
  "40",
  "41",
  "51",
  "64",
  "65",
  "68",
  "69",
  "70",
  "71",
]);

export type NormalizePhoneResult =
  | { ok: true; e164: string }
  | { ok: false; error: string };

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * National subscriber digits after +386 (no leading 0).
 */
export function nationalDigitsFromE164(e164: string): string | null {
  if (!e164.startsWith("+386")) {
    return null;
  }
  const national = e164.slice(4);
  return /^\d+$/.test(national) ? national : null;
}

/**
 * Normalize Slovenian (and already-international) numbers to E.164 +386…
 * Rejects numbers that cannot be resolved reliably.
 * Accepts both mobile and geographic (landline) numbers.
 */
export function normalizeSlovenianPhone(
  raw: string | null | undefined,
): NormalizePhoneResult {
  if (!raw?.trim()) {
    return { ok: false, error: "Missing phone number" };
  }

  const trimmed = raw.trim();
  let digits = digitsOnly(trimmed);

  if (!digits) {
    return { ok: false, error: "Phone contains no digits" };
  }

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("386")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length < 8 || digits.length > 9) {
    return { ok: false, error: "Invalid Slovenian phone length" };
  }

  if (!/^\d+$/.test(digits)) {
    return { ok: false, error: "Phone contains invalid characters" };
  }

  return { ok: true, e164: `+386${digits}` };
}

export function isValidSlovenianPhone(raw: string | null | undefined): boolean {
  return normalizeSlovenianPhone(raw).ok;
}

/**
 * True only for Slovenian mobile numbers that can receive SMS.
 * Normalizes first, then checks the national number against known mobile
 * network prefixes (not a naive "starts with 04" string check).
 */
export function isSlovenianMobilePhone(
  raw: string | null | undefined,
): boolean {
  const normalized = normalizeSlovenianPhone(raw);
  if (!normalized.ok) {
    return false;
  }

  const national = nationalDigitsFromE164(normalized.e164);
  if (!national || national.length !== 8) {
    return false;
  }

  return SI_MOBILE_PREFIXES.has(national.slice(0, 2));
}
