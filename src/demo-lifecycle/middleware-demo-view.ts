import { extractViewContext } from "./view-eligibility";
import { recordDemoView } from "./record-demo-view";

const RESERVED_ROOT_SEGMENTS = new Set([
  "admin",
  "api",
  "piskotki",
  "politika-zasebnosti",
  "pogosta-vprasanja",
  "splosni-pogoji",
  "_next",
]);

/**
 * Extract a demo site slug from a public page path, or null if not a main demo URL.
 * Handles /{slug} and /demo/{slug} (before rewrite).
 */
export function extractDemoSlugFromPathname(pathname: string): string | null {
  if (pathname.startsWith("/demo/")) {
    const segment = pathname.slice("/demo/".length).split("/")[0]?.trim();
    if (!segment || segment.includes(".")) {
      return null;
    }
    return segment;
  }

  const match = pathname.match(/^\/([^/]+)\/?$/);
  if (!match?.[1]) {
    return null;
  }

  const slug = match[1].trim();
  if (!slug || RESERVED_ROOT_SEGMENTS.has(slug)) {
    return null;
  }

  return slug;
}

/** Fire-and-forget demo view recording from Edge middleware. */
export function scheduleDemoViewFromRequest(
  slug: string,
  requestHeaders: Headers,
): void {
  const context = extractViewContext(requestHeaders);
  void recordDemoView(slug, context);
}
