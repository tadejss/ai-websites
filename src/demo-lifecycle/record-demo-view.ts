import { isCustomer } from "@/customers/store";
import { isDemoTrackingExcludedSlug } from "./excluded-slugs";
import {
  incrementDemoViewIfNew,
  type RecordViewResult,
} from "./store";
import { shouldCountDemoView, type DemoViewContext } from "./view-eligibility";
import { buildViewerKey, dedupeWindowHours } from "./viewer-key";

export type { DemoViewContext } from "./view-eligibility";
export { extractViewContext } from "./view-eligibility";

/**
 * Record a meaningful demo view. Call from after() with pre-extracted context.
 */
export async function recordDemoView(
  slug: string,
  context: DemoViewContext,
): Promise<RecordViewResult> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return { recorded: false, slug, reason: "missing_slug" };
  }

  if (isDemoTrackingExcludedSlug(normalizedSlug)) {
    return { recorded: false, slug: normalizedSlug, reason: "excluded_slug" };
  }

  if (await isCustomer(normalizedSlug)) {
    return { recorded: false, slug: normalizedSlug, reason: "customer" };
  }

  if (!shouldCountDemoView(context)) {
    return { recorded: false, slug: normalizedSlug, reason: "ineligible_request" };
  }

  const viewerKey = buildViewerKey(normalizedSlug, context);
  if (!viewerKey) {
    return {
      recorded: false,
      slug: normalizedSlug,
      reason: "missing_view_hash_secret",
    };
  }

  const expiresAt = new Date(
    Date.now() + dedupeWindowHours() * 60 * 60 * 1000,
  );

  try {
    return await incrementDemoViewIfNew(normalizedSlug, viewerKey, expiresAt);
  } catch (error) {
    console.warn(
      "[demo-lifecycle] record view failed:",
      error instanceof Error ? error.message : error,
    );
    return {
      recorded: false,
      slug: normalizedSlug,
      reason: "database_error",
    };
  }
}
