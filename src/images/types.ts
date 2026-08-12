import type { SiteImage } from "@/content/types/site";

export type ImageSlot = "hero" | "services";

export type ImageSearchBrief = {
  query: string;
  alt: string;
  orientation: "portrait" | "squarish" | "landscape";
};

export type ImageSearchPlan = Record<ImageSlot, ImageSearchBrief>;

export type UnsplashPhoto = {
  id: string;
  urls: { regular: string };
  user: { name: string };
  alt_description: string | null;
  width: number;
  height: number;
};

export type SavedSiteImage = SiteImage & {
  photographer?: string;
};
