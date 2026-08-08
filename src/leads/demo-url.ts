import type { LeadRecord } from "./store";
import { toAbsoluteUrl } from "@/site-url";

/**
 * Public URL for a lead's demo site. Composes the absolute URL at display
 * time from NEXT_PUBLIC_SITE_URL so changing the domain does not require
 * rewriting every lead file. Falls back to the stored relative path.
 */
export function getDemoUrl(lead: LeadRecord): string {
  const path = lead.url?.trim() || (lead.slug ? `/${lead.slug}` : "");

  if (!path) {
    return "";
  }

  return toAbsoluteUrl(path);
}
