import type { LeadRecord } from "./store";
import { toAbsoluteUrl } from "@/site-url";

/**
 * Public URL for a lead's demo site. Composes the absolute URL at display
 * time from NEXT_PUBLIC_SITE_URL (e.g. https://zbrendiraj.si/demo) so changing
 * the domain does not require rewriting every lead file. Falls back to the
 * stored relative path.
 */
export function getDemoUrl(lead: LeadRecord): string {
  const rawPath = lead.url?.trim() || (lead.slug ? `/${lead.slug}` : "");

  if (!rawPath) {
    return "";
  }

  // Lead urls are stored as /{slug}; strip a leading /demo if already present.
  const slugPath = rawPath.replace(/^\/demo(?=\/|$)/, "") || rawPath;
  const path = slugPath.startsWith("/") ? slugPath : `/${slugPath}`;

  return toAbsoluteUrl(path);
}
