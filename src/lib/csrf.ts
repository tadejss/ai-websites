import { PUBLIC_SITE_URL, getSiteBaseUrl } from "@/site-url";

function hostnameFromUrl(value: string): string | null {
  try {
    return new URL(
      value.includes("://") ? value : `https://${value}`,
    ).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Hosts allowed to initiate cookie-authenticated browser mutations.
 * Custom customer domains are NOT included — admin/onboarding APIs live on
 * the platform origin only.
 */
export function getTrustedMutationHosts(): Set<string> {
  const hosts = new Set<string>([
    "zbrendiraj.si",
    "www.zbrendiraj.si",
    "localhost",
    "127.0.0.1",
  ]);

  const configured = getSiteBaseUrl() || PUBLIC_SITE_URL;
  const configuredHost = hostnameFromUrl(configured);
  if (configuredHost) {
    hosts.add(configuredHost);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const vercelHost = hostnameFromUrl(
      vercelUrl.includes("://") ? vercelUrl : `https://${vercelUrl}`,
    );
    if (vercelHost) {
      hosts.add(vercelHost);
    }
  }

  return hosts;
}

export type OriginCheckResult =
  | { ok: true; host: string }
  | { ok: false; reason: "missing_origin" | "untrusted_origin" };

/**
 * Strict Origin check for cookie-authenticated state changes.
 * Policy: require Origin (or Referer fallback); reject if host not allowlisted.
 * Missing Origin on mutations → reject (fail closed for browsers).
 */
export function checkTrustedMutationOrigin(request: Request): OriginCheckResult {
  const allowed = getTrustedMutationHosts();

  const origin = request.headers.get("origin")?.trim();
  if (origin) {
    const host = hostnameFromUrl(origin);
    if (!host || !allowed.has(host)) {
      return { ok: false, reason: "untrusted_origin" };
    }
    return { ok: true, host };
  }

  const referer = request.headers.get("referer")?.trim();
  if (referer) {
    const host = hostnameFromUrl(referer);
    if (!host || !allowed.has(host)) {
      return { ok: false, reason: "untrusted_origin" };
    }
    return { ok: true, host };
  }

  return { ok: false, reason: "missing_origin" };
}

export function isTrustedMutationOrigin(request: Request): boolean {
  return checkTrustedMutationOrigin(request).ok;
}
