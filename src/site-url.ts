/**
 * Public origin the generated demos are served from, e.g.
 * https://zbrendiraj.si/demo. Left unset in local development, where relative
 * paths are still useful.
 */
export function getSiteBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) {
    return null;
  }

  return raw.replace(/\/+$/, "");
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

function hostnameFromUrl(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAllowedCheckoutHost(hostname: string): boolean {
  if (STATIC_ALLOWED_HOSTS.has(hostname)) {
    return true;
  }

  const configured = getSiteBaseUrl();
  if (configured) {
    const configuredHost = hostnameFromUrl(
      configured.includes("://") ? configured : `https://${configured}`,
    );
    if (configuredHost && configuredHost === hostname) {
      return true;
    }
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const vercelHost = hostnameFromUrl(
      vercelUrl.includes("://") ? vercelUrl : `https://${vercelUrl}`,
    );
    if (vercelHost && vercelHost === hostname) {
      return true;
    }
  }

  return false;
}

/**
 * Origin of the browser request that started checkout (Origin / forwarded host).
 * Used so Stripe cancel/success return to the domain the user was on, not a
 * stale NEXT_PUBLIC_SITE_URL (e.g. an old *.vercel.app hostname).
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
