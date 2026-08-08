/**
 * Public origin the generated demos are served from, e.g.
 * https://factory-domain.com. Left unset in local development, where relative
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
