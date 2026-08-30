/** Exact-body opt-out keywords (after normalize). */
const EXACT_OPT_OUT = new Set([
  "stop",
  "odjava",
  "ne",
  "preklic",
  "unsubscribe",
  "stop sms",
  "ne hvala",
]);

/** Multi-word / explicit tokens that may appear inside a longer reply. */
const CONTAINED_OPT_OUT = new Set(["stop", "odjava", "preklic", "unsubscribe"]);

export function normalizeInboundBody(body: string): string {
  return body
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[.!?,;:]+$/g, "");
}

/**
 * Opt-out detection.
 * Short ambiguous words like "ne" only match as the whole message.
 * Explicit keywords (STOP, ODJAVA, …) also match as a token inside the body.
 */
export function isOptOutMessage(body: string): boolean {
  const normalized = normalizeInboundBody(body);
  if (!normalized) {
    return false;
  }

  if (EXACT_OPT_OUT.has(normalized)) {
    return true;
  }

  const tokens = normalized.split(/\s+/);
  return tokens.some((token) => CONTAINED_OPT_OUT.has(token));
}
