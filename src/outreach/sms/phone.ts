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
 * Normalize Slovenian (and already-international) numbers to E.164 +386…
 * Rejects numbers that cannot be resolved reliably.
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

  const prefix = digits.slice(0, 2);
  if (!SI_MOBILE_PREFIXES.has(prefix) && digits.length === 8) {
    // Landlines (e.g. 1, 2, 3, 4, 5, 7) are 8 digits after dropping 0.
    // Allow them for completeness — businesses often list landlines.
  }

  if (!/^\d+$/.test(digits)) {
    return { ok: false, error: "Phone contains invalid characters" };
  }

  return { ok: true, e164: `+386${digits}` };
}

export function isValidSlovenianPhone(raw: string | null | undefined): boolean {
  return normalizeSlovenianPhone(raw).ok;
}
