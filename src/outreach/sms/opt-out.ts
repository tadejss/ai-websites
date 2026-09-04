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

export type SmsOptOutKeyword = "STOP" | "NE" | "ODJAVA" | "PREKLIC" | "UNSUBSCRIBE";

export type SmsOptOutParse = {
  optedOut: boolean;
  keyword?: SmsOptOutKeyword;
};

const KEYWORD_MAP: Record<string, SmsOptOutKeyword> = {
  stop: "STOP",
  "stop sms": "STOP",
  odjava: "ODJAVA",
  ne: "NE",
  "ne hvala": "NE",
  preklic: "PREKLIC",
  unsubscribe: "UNSUBSCRIBE",
};

export function normalizeInboundBody(body: string): string {
  return body
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[.!?,;:]+$/g, "");
}

export function parseSmsOptOut(body: string): SmsOptOutParse {
  const normalized = normalizeInboundBody(body);
  if (!normalized) {
    return { optedOut: false };
  }

  if (EXACT_OPT_OUT.has(normalized)) {
    return { optedOut: true, keyword: KEYWORD_MAP[normalized] ?? "STOP" };
  }

  const tokens = normalized.split(/\s+/);
  for (const token of tokens) {
    if (CONTAINED_OPT_OUT.has(token)) {
      return { optedOut: true, keyword: KEYWORD_MAP[token] ?? "STOP" };
    }
  }

  return { optedOut: false };
}

/**
 * Opt-out detection.
 * Short ambiguous words like "ne" only match as the whole message.
 * Explicit keywords (STOP, ODJAVA, …) also match as a token inside the body.
 */
export function isOptOutMessage(body: string): boolean {
  return parseSmsOptOut(body).optedOut;
}

export function canCancelOnOptOut(status: string): boolean {
  return status === "queued" || status === "claimed";
}
