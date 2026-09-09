export const POOL_TARGET = 30;
export const INITIAL_FILL = 10;
export const MAX_IMAGE_USES = 40;
/**
 * When true, pool assets remain eligible regardless of usageCount.
 * Usage still ranks selection (prefer lower counts) but never hard-blocks reuse
 * across demos in the same profession/category.
 */
export const ALLOW_SHARED_POOL_PHOTOS = true;
/** Minimum distinct stock photos assigned to each demo site (hero + services + gallery). */
export const MIN_DEMO_SITE_IMAGES = 6;
