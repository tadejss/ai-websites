/**
 * Public origin demos are served from. Used for canonical, Open Graph, JSON-LD,
 * and outreach links so SMS / iMessage previews never rewrite to a stale host.
 */
export const PUBLIC_SITE_URL = "https://zbrendiraj.si";

const DEPRECATED_SITE_HOSTS = new Set([
  "splet.vercel.app",
  "www.splet.vercel.app",
]);

function hostnameFromUrl(value: string): string | null {
  try {
    return new URL(
      value.includes("://") ? value : `https://${value}`,
    ).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isDeprecatedSiteUrl(value: string): boolean {
  const host = hostnameFromUrl(value);
  return host != null && DEPRECATED_SITE_HOSTS.has(host);
}

/**
 * Public origin for absolute URLs. Never returns the retired splet.vercel.app
 * host — even if an env var still points there on Vercel.
 *
 * Prefer server-only `SITE_URL` (Vercel Config). `NEXT_PUBLIC_SITE_URL` is
 * accepted only as a legacy fallback.
 */
export function getSiteBaseUrl(): string | null {
  const raw =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (raw) {
    const normalized = raw.replace(/\/+$/, "");
    if (isDeprecatedSiteUrl(normalized)) {
      return PUBLIC_SITE_URL;
    }
    return normalized;
  }

  // Deployed builds must always emit zbrendiraj.si for share previews.
  if (process.env.VERCEL) {
    return PUBLIC_SITE_URL;
  }

  return null;
}

export function toAbsoluteUrl(path: string): string {
  if (!path) {
    return "";
  }

  const base = getSiteBaseUrl();

  if (!base) {
    return path;
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

const STATIC_ALLOWED_HOSTS = new Set([
  "zbrendiraj.si",
  "www.zbrendiraj.si",
  "localhost",
  "127.0.0.1",
]);

function isAllowedCheckoutHost(hostname: string): boolean {
  if (DEPRECATED_SITE_HOSTS.has(hostname)) {
    return false;
  }

  if (STATIC_ALLOWED_HOSTS.has(hostname)) {
    return true;
  }

  const configured = getSiteBaseUrl();
  if (configured) {
    const configuredHost = hostnameFromUrl(configured);
    if (configuredHost && configuredHost === hostname) {
      return true;
    }
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const vercelHost = hostnameFromUrl(
      vercelUrl.includes("://") ? vercelUrl : `https://${vercelUrl}`,
    );
    if (
      vercelHost &&
      vercelHost === hostname &&
      !DEPRECATED_SITE_HOSTS.has(vercelHost)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Origin of the browser request that started checkout (Origin / forwarded host).
 * Used so Stripe cancel/success return to the domain the user was on, not a
 * stale SITE_URL.
 */
export function resolveRequestOrigin(request: Request): string | null {
  const originHeader = request.headers.get("origin")?.trim();
  if (originHeader) {
    const host = hostnameFromUrl(originHeader);
    if (host && isAllowedCheckoutHost(host)) {
      return originHeader.replace(/\/+$/, "");
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostHeader = forwardedHost || request.headers.get("host")?.trim();
  if (!hostHeader) {
    return null;
  }

  const hostname = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  if (!isAllowedCheckoutHost(hostname)) {
    return null;
  }

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (hostname === "localhost" || hostname === "127.0.0.1" ? "http" : "https");

  return `${proto}://${hostHeader}`;
}
