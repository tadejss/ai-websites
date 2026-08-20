/**
 * Maps custom production hostnames to an existing client slug.
 * Path-based demos stay available at /{slug} and /demo/{slug}.
 */
const HOST_TO_SLUG: Record<string, string> = {
  "zbrendiraj.si": "zbrendiraj-si",
  "www.zbrendiraj.si": "zbrendiraj-si",
};

export function getSlugForHost(hostHeader: string | null): string | null {
  if (!hostHeader) {
    return null;
  }

  const hostname = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  return HOST_TO_SLUG[hostname] ?? null;
}
