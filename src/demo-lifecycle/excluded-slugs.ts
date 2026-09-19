/** Slugs that are not outreach demos — never record lifecycle views. */
const EXCLUDED_SLUGS = new Set([
  "zbrendiraj-si",
  "default",
  "test",
]);

export function isDemoTrackingExcludedSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  if (EXCLUDED_SLUGS.has(normalized)) {
    return true;
  }
  // Template preview clients (not SMS outreach demos).
  return normalized.startsWith("preview-");
}
