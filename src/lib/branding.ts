import type { Metadata } from "next";
import type { SiteConfig } from "@/content/types/site";

/** Default tab icon for demo pages without `branding.icon` (Zbrendiraj.si mark). */
export const ZBRENDIRAJ_FALLBACK_ICON = "/brand/zbrendiraj-si/icon.png";

export function getBrandLogo(config: SiteConfig): string | undefined {
  return config.branding?.logo;
}

export function getBrandIconUrl(config: SiteConfig): string {
  return config.branding?.icon ?? ZBRENDIRAJ_FALLBACK_ICON;
}

export function getBrandIcons(config: SiteConfig): Metadata["icons"] {
  const icon = getBrandIconUrl(config);

  return {
    icon: [{ url: icon, type: "image/png" }],
    apple: [{ url: icon, sizes: "180x180", type: "image/png" }],
  };
}

/** Adds per-site favicon metadata without changing any other metadata fields. */
export function withBrandIcons(metadata: Metadata, config: SiteConfig): Metadata {
  return { ...metadata, icons: getBrandIcons(config) };
}
