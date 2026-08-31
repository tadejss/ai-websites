/** Slugs that are not outreach demos — never record lifecycle views. */
const EXCLUDED_SLUGS = new Set([
  "zbrendiraj-si",
  "default",
  "test",
]);

export function isDemoTrackingExcludedSlug(slug: string): boolean {
  return EXCLUDED_SLUGS.has(slug.trim().toLowerCase());
}
