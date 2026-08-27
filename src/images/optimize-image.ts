import sharp from "sharp";
import type { ImageSlot } from "./types";

export type OptimizedImage = {
  avif: Buffer;
  webp: Buffer;
  width: number;
  height: number;
  format: "avif";
  fallbackFormat: "webp";
};

const SLOT_LIMITS: Record<
  ImageSlot,
  { maxWidth: number; maxHeight: number; quality: number }
> = {
  hero: { maxWidth: 1600, maxHeight: 2400, quality: 72 },
  services: { maxWidth: 1400, maxHeight: 1400, quality: 70 },
};

/**
 * Resize to slot limits (contain, no upscale) and encode AVIF + WebP.
 */
export async function optimizeStockImage(
  input: Buffer,
  slot: ImageSlot,
): Promise<OptimizedImage> {
  const limits = SLOT_LIMITS[slot];
  const base = sharp(input, { failOn: "none" }).rotate();

  const resized = base.resize({
    width: limits.maxWidth,
    height: limits.maxHeight,
    fit: "inside",
    withoutEnlargement: true,
  });

  const [avif, webp, meta] = await Promise.all([
    resized.clone().avif({ quality: limits.quality, effort: 4 }).toBuffer(),
    resized
      .clone()
      .webp({ quality: Math.min(limits.quality + 8, 82), effort: 4 })
      .toBuffer(),
    resized.clone().metadata(),
  ]);

  return {
    avif,
    webp,
    width: meta.width ?? limits.maxWidth,
    height: meta.height ?? limits.maxHeight,
    format: "avif",
    fallbackFormat: "webp",
  };
}
