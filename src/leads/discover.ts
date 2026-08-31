import { slugFromBusinessName, uniqueSlug } from "@/clients/slug";
import type { RawBusinessData } from "@/ai/types/raw-business-data";
import { searchPlaces } from "@/sources/google-places-source";
import {
  discoveryNoisePattern,
  ICP_EXCLUDE_NAME_PATTERN,
  leadMatchesIndustry,
  type LeadIndustryId,
} from "./industry-filter";
import {
  professionMatchesBusiness,
  type DiscoveryProfessionId,
} from "./discovery-professions";
import {
  getRegionLocationBias,
  matchesRegion,
} from "./region";
import { isSlovenianMobilePhone } from "@/outreach/sms/phone";
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
  /** When set, only save leads with a valid Slovenian mobile number. */
  requireMobilePhone?: boolean;
  industry?: LeadIndustryId;
  profession?: DiscoveryProfessionId;
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
    locationBias: getRegionLocationBias(options.region),
  });

  const existing = readAllLeads();
  const knownPlaceIds = new Set(
    existing
      .map((lead) => lead.googlePlaceId)
      .filter((id): id is string => Boolean(id)),
  );
  const takenSlugs = new Set(existing.map((lead) => lead.slug));

  const useProfession = Boolean(options.profession);
  const queryImpliesIndustry = !useProfession
    && leadMatchesIndustry(options.industry, {
      industry: query,
      companyName: "",
    });
  const noiseName = useProfession
    ? ICP_EXCLUDE_NAME_PATTERN
    : discoveryNoisePattern(options.industry);

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


    if (options.requireMobilePhone && !isSlovenianMobilePhone(business.phone)) {
      results.push({
        outcome: "skipped",
        reason: business.phone?.trim()
          ? "no valid Slovenian mobile phone"
          : "missing phone",
        companyName,
        googlePlaceId,
      });
      continue;
    }

    if (useProfession) {
      if (
        !professionMatchesBusiness(options.profession!, {
          industry: business.category,
          companyName,
        })
      ) {
        results.push({
          outcome: "skipped",
          reason: "profession mismatch",
          companyName,
          googlePlaceId,
        });
        continue;
      }
      if (noiseName.test(companyName)) {
        results.push({
          outcome: "skipped",
          reason: "profession mismatch",
          companyName,
          googlePlaceId,
        });
        continue;
      }
    } else if (queryImpliesIndustry) {
      if (noiseName.test(companyName)) {
        results.push({
          outcome: "skipped",
          reason: "industry mismatch",
          companyName,
          googlePlaceId,
        });
        continue;
      }
    } else if (
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
