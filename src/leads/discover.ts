import { slugFromBusinessName, uniqueSlug } from "@/clients/slug";
import type { RawBusinessData } from "@/ai/types/raw-business-data";
import { searchPlaces } from "@/sources/google-places-source";
import {
  leadMatchesIndustry,
  type LeadIndustryId,
} from "./industry-filter";
import {
  matchesRegion,
  NOTRANJSKA_LOCATION_BIAS,
  NOTRANJSKA_REGION,
} from "./region";
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

export type DiscoverLeadsOptions = {
  region?: string;
  withoutWebsiteOnly?: boolean;
  industry?: LeadIndustryId;
  sourceQuery?: string;
};

function toLeadRecord(
  slug: string,
  business: RawBusinessData,
  sourceQuery?: string,
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
    ...(sourceQuery ? { sourceQuery } : {}),
  };
}

export async function discoverLeads(
  query: string,
  limit: number,
  options: DiscoverLeadsOptions = {},
): Promise<DiscoveryResult[]> {
  const businesses = await searchPlaces(query, limit, {
    locationBias:
      options.region === NOTRANJSKA_REGION
        ? NOTRANJSKA_LOCATION_BIAS
        : undefined,
  });

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

    if (!matchesRegion(options.region, business.address)) {
      results.push({
        outcome: "skipped",
        reason: "outside region",
        companyName,
        googlePlaceId,
      });
      continue;
    }

    if (options.withoutWebsiteOnly && business.website?.trim()) {
      results.push({
        outcome: "skipped",
        reason: "already has a website",
        companyName,
        googlePlaceId,
      });
      continue;
    }

    if (
      !leadMatchesIndustry(options.industry, {
        industry: business.category,
        companyName,
      })
    ) {
      results.push({
        outcome: "skipped",
        reason: "industry mismatch",
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

    saveLead(toLeadRecord(slug, business, options.sourceQuery ?? query));

    takenSlugs.add(slug);

    if (googlePlaceId) {
      knownPlaceIds.add(googlePlaceId);
    }

    results.push({ outcome: "discovered", slug, companyName, googlePlaceId });
  }

  return results;
}
