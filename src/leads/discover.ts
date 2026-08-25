import { slugFromBusinessName, uniqueSlug } from "@/clients/slug";
import type { RawBusinessData } from "@/ai/types/raw-business-data";
import { searchPlaces } from "@/sources/google-places-source";
import {
  leadMatchesIndustry,
  type LeadIndustryId,
} from "./industry-filter";
import {
  getRegionLocationBias,
  matchesRegion,
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
    locationBias: getRegionLocationBias(options.region),
  });

  const existing = readAllLeads();
  const knownPlaceIds = new Set(
    existing
      .map((lead) => lead.googlePlaceId)
      .filter((id): id is string => Boolean(id)),
  );
  const takenSlugs = new Set(existing.map((lead) => lead.slug));

  // Targeted queries already scope industry, but drop clear cross-industry noise.
  // Exclude the active industry's own keywords so we don't reject matching businesses.
  const queryImpliesIndustry = leadMatchesIndustry(options.industry, {
    industry: query,
    companyName: "",
  });
  const noiseByIndustry: Record<string, RegExp> = {
    frizer:
      /pekarna|gostil|restavrac|elektro|vulkan|avtoservis|keramič|keramic|mizarstvo|slikopleskar|fasaderstvo|mehanizacija|strojni\s+ometi|transport|\bšola\b|\bsola\b|vzgojitelj|trenerstvo|strojne\s+inštalacije|strojne\s+instalacije|gradbeništvo|gradbenistvo/i,
    keramicar:
      /pekarna|gostil|restavrac|frizer|elektro|vulkan|avtoservis|trgovina|market|spar|mercator|mizarstvo|slikopleskar|fasaderstvo|mehanizacija|strojni\s+ometi|transport|unikatno\s+oblikovanje|oblikovanje\s+keramike|okrasna\s+.*keramik|kopalnice\b|extra-?form|\bšola\b|\bsola\b|vzgojitelj|trenerstvo|strojne\s+inštalacije|strojne\s+instalacije/i,
    elektro:
      /pekarna|gostil|restavrac|frizer|vulkan|avtoservis|keramič|keramic|mizarstvo|slikopleskar|fasaderstvo|mehanizacija|strojni\s+ometi|transport|\bšola\b|\bsola\b|vzgojitelj|trenerstvo/i,
    vulkanizer:
      /pekarna|gostil|restavrac|frizer|elektro|keramič|keramic|mizarstvo|slikopleskar|fasaderstvo|mehanizacija|strojni\s+ometi|transport|\bšola\b|\bsola\b|vzgojitelj|trenerstvo/i,
  };
  const noiseName =
    (options.industry && noiseByIndustry[options.industry]) ||
    /pekarna|gostil|restavrac|avtoservis|trgovina|market|spar|mercator|\bšola\b|\bsola\b|vzgojitelj|trenerstvo/i;

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

    if (queryImpliesIndustry) {
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
