import { slugFromBusinessName, uniqueSlug } from "@/clients/slug";
import type { RawBusinessData } from "@/ai/types/raw-business-data";
import { searchPlaces } from "@/sources/google-places-source";
import { readAllLeads, saveLead, type LeadRecord } from "./store";

export type DiscoveryResult =
  | {
      outcome: "discovered";
      slug: string;
      companyName: string;
      googlePlaceId: string;
    }
  | {
      outcome: "skipped";
      reason: string;
      companyName: string;
      googlePlaceId: string;
    };

function toLeadRecord(
  slug: string,
  business: RawBusinessData,
): LeadRecord {
  return {
    slug,
    url: "",
    googlePlaceId: business.googlePlaceId ?? "",
    companyName: business.name ?? "",
    industry: business.category ?? "",
    phone: business.phone ?? "",
    address: business.address ?? "",
    googleRating: business.rating ?? "",
    googleReviewCount: business.reviewCount ?? "",
    existingWebsite: business.website ?? "",
    status: "discovered",
  };
}

export async function discoverLeads(
  query: string,
  limit: number,
): Promise<DiscoveryResult[]> {
  const businesses = await searchPlaces(query, limit);

  const existing = readAllLeads();
  const knownPlaceIds = new Set(
    existing
      .map((lead) => lead.googlePlaceId)
      .filter((id): id is string => Boolean(id)),
  );
  const takenSlugs = new Set(existing.map((lead) => lead.slug));

  const results: DiscoveryResult[] = [];

  for (const business of businesses) {
    const companyName = business.name ?? "";
    const googlePlaceId = business.googlePlaceId ?? "";

    if (googlePlaceId && knownPlaceIds.has(googlePlaceId)) {
      results.push({
        outcome: "skipped",
        reason: "already known",
        companyName,
        googlePlaceId,
      });
      continue;
    }

    const base = slugFromBusinessName(companyName);

    if (!base) {
      results.push({
        outcome: "skipped",
        reason: "no usable slug from the business name",
        companyName,
        googlePlaceId,
      });
      continue;
    }

    const slug = uniqueSlug(base, (candidate) => takenSlugs.has(candidate));

    saveLead(toLeadRecord(slug, business));

    takenSlugs.add(slug);

    if (googlePlaceId) {
      knownPlaceIds.add(googlePlaceId);
    }

    results.push({ outcome: "discovered", slug, companyName, googlePlaceId });
  }

  return results;
}
