/**
 * Client identity for rate limiting.
 *
 * On Vercel, the platform overwrites X-Forwarded-For. Prefer the leftmost
 * entry (original client). Do not trust multi-hop chains beyond that for
 * rate-limit keys — spoofed prepends are mitigated by platform overwrite.
 */
export function resolveClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first.slice(0, 128);
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp.slice(0, 128);
  }

  return "unknown";
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function rateLimitPepper(): string {
  return (
    process.env.RATE_LIMIT_PEPPER?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.ADMIN_SECRET?.trim() ||
    "dev-rate-limit-pepper"
  );
}

/** SHA-256 hex of peppered material — never persist raw IPs as rate-limit keys. */
export async function hashRateLimitMaterial(material: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${rateLimitPepper()}:${material}`),
  );
  return bytesToHex(digest);
}

/** Short fingerprint of a token for rate-limit isolation (not reversible). */
export async function fingerprintSecret(value: string): Promise<string> {
  return (await hashRateLimitMaterial(`fp:${value}`)).slice(0, 32);
}
