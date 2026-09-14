import type { SiteConfig } from "@/content/types/site";
import { getGalleryItems } from "../shared/section-data";

export type MonoMediaItem = { src: string; alt: string };

/**
 * Full-viewport kinetic panels are tall (object-cover over ~100vh) but often narrow.
 * Width-based `NNvw` sizes pick tiny srcset candidates → pixelation when covering height.
 * Force a large absolute width so Next serves enough resolution for the tall crop.
 */
export const MONO_KINETIC_SIZES =
  "(max-width: 768px) 1280px, (max-width: 1280px) 1600px, 1920px";
export const MONO_KINETIC_QUALITY = 90;

/**
 * Visual pool for Mono side panels / mosaic / stacked / offers.
 * Intentionally excludes hero — hero image is reserved for the kinetic hero center only.
 */
export function getMonoMediaPool(config: SiteConfig): MonoMediaItem[] {
  const out: MonoMediaItem[] = [];
  const seen = new Set<string>();
  const heroSrc = config.images?.hero?.src?.trim();

  const push = (src: string | undefined, alt: string) => {
    const trimmed = src?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    if (heroSrc && trimmed === heroSrc) return;
    seen.add(trimmed);
    out.push({ src: trimmed, alt: alt || "" });
  };

  for (const item of getGalleryItems(config)) {
    push(item.src, item.alt);
  }
  push(config.images?.services?.src, config.images?.services?.alt || "");

  return out;
}

/** Repeat pool items to fill a fixed slot count (layout geometry). */
export function fillMonoMedia(
  pool: MonoMediaItem[],
  count: number,
): MonoMediaItem[] {
  if (pool.length === 0 || count <= 0) return [];
  const items: MonoMediaItem[] = [];
  for (let i = 0; i < count; i += 1) {
    items.push(pool[i % pool.length]!);
  }
  return items;
}
