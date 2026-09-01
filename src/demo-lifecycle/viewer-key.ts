import type { DemoViewContext } from "./view-eligibility";

const DEV_FALLBACK_SECRET = "demo-view-dev-only-not-for-production";

function hashSecret(): string {
  return (
    process.env.DEMO_VIEW_HASH_SECRET?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : DEV_FALLBACK_SECRET)
  );
}

function normalizeIpPrefix(ip: string | null): string {
  if (!ip?.trim()) {
    return "unknown";
  }

  const trimmed = ip.trim();

  // IPv4 — use /24 prefix for privacy
  if (trimmed.includes(".")) {
    const parts = trimmed.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  // IPv6 — truncate to /48 equivalent (first 3 hextets)
  if (trimmed.includes(":")) {
    const segments = trimmed.split(":").filter(Boolean);
    return segments.slice(0, 3).join(":") || trimmed.slice(0, 19);
  }

  return trimmed.slice(0, 32);
}

function uaPrefix(userAgent: string): string {
  return userAgent.trim().slice(0, 80).toLowerCase();
}

async function hmacSha256Hex(secret: string, material: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(material));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildViewerKey(
  slug: string,
  context: DemoViewContext,
): Promise<string | null> {
  const secret = hashSecret();
  if (!secret) {
    return null;
  }

  const material = [
    slug.trim().toLowerCase(),
    normalizeIpPrefix(context.clientIp),
    uaPrefix(context.userAgent),
  ].join("|");

  return hmacSha256Hex(secret, material);
}

export function dedupeWindowHours(): number {
  const raw = Number.parseInt(process.env.DEMO_VIEW_DEDUPE_HOURS ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 4;
}
