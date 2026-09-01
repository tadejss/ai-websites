import type { RawBusinessData } from "@/ai/types/raw-business-data";
import type { LeadRecord } from "@/leads/store";
import type { BusinessSource } from "./types";

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places";

/**
 * Text Search Essentials (IDs Only) — cheapest search SKU.
 * Field: places.id → dedup / backfill place_id lookup.
 */
export const PLACE_ID_SEARCH_MASK = "places.id";

/**
 * Text Search Enterprise — highest field tier in this mask.
 *
 * Essentials: places.id, places.types, places.formattedAddress
 * Pro: places.displayName, places.primaryType
 * Enterprise: places.nationalPhoneNumber, places.websiteUri,
 *   places.rating, places.userRatingCount
 * Pagination: nextPageToken (no SKU charge)
 *
 * Consumers: discoverLeads filters (region, website, phone, profession),
 * lead JSON (priority scoring), dedup by place_id.
 */
export const DISCOVERY_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.primaryType",
  "places.types",
  "places.nationalPhoneNumber",
  "places.formattedAddress",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "nextPageToken",
].join(",");

/**
 * Place Details Enterprise — demo generation from a known place_id.
 *
 * Essentials: id, types, formattedAddress
 * Pro: displayName, primaryType
 * Enterprise: nationalPhoneNumber, websiteUri, regularOpeningHours,
 *   rating, userRatingCount
 *
 * Consumers: generateBusinessInput (contact fields, openingHours, category).
 * Omits editorialSummary and reviews (Enterprise + Atmosphere tier).
 */
export const GENERATION_DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "primaryType",
  "types",
  "nationalPhoneNumber",
  "formattedAddress",
  "websiteUri",
  "regularOpeningHours",
  "rating",
  "userRatingCount",
].join(",");

/**
 * Place Details Enterprise — incremental fetch when lead JSON already
 * holds contact and rating fields from discovery.
 *
 * Field: regularOpeningHours → AI openingHours in BusinessInput.
 */
export const OPENING_HOURS_DETAILS_MASK = "regularOpeningHours";

/**
 * Place Details Enterprise + Atmosphere — legacy full fetch.
 *
 * Adds editorialSummary and reviews (Atmosphere tier).
 *
 * @deprecated Prefer GENERATION_DETAILS_FIELD_MASK or OPENING_HOURS_DETAILS_MASK.
 */
export const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "primaryType",
  "types",
  "editorialSummary",
  "nationalPhoneNumber",
  "formattedAddress",
  "websiteUri",
  "regularOpeningHours",
  "rating",
  "userRatingCount",
  "reviews",
].join(",");

// Google returns at most 20 results per page and at most 3 pages per query.
const MAX_PAGE_SIZE = 20;
const MAX_RESULTS_PER_QUERY = 60;

// A nextPageToken is not valid immediately; Google needs a moment to propagate it.
const PAGE_TOKEN_DELAY_MS = 2000;

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  primaryType?: string;
  types?: string[];
  editorialSummary?: { text?: string };
  nationalPhoneNumber?: string;
  formattedAddress?: string;
  websiteUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{ text?: { text?: string } }>;
};

type GooglePlacesSearchResponse = {
  places?: GooglePlace[];
  nextPageToken?: string;
};

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  }

  return apiKey;
}

function mapPlaceToRawBusinessData(place: GooglePlace): RawBusinessData {
  return {
    googlePlaceId: place.id,
    name: place.displayName?.text,
    category: place.primaryType ?? place.types?.[0],
    description: place.editorialSummary?.text,
    phone: place.nationalPhoneNumber,
    address: place.formattedAddress,
    website: place.websiteUri,
    openingHours: place.regularOpeningHours?.weekdayDescriptions?.join(" · "),
    rating: place.rating !== undefined ? String(place.rating) : undefined,
    reviewCount:
      place.userRatingCount !== undefined
        ? String(place.userRatingCount)
        : undefined,
    reviews: place.reviews
      ?.map((review) => review.text?.text)
      .filter((review): review is string => Boolean(review)),
  };
}

async function textSearch(
  textQuery: string,
  fieldMask: string,
  pageSize = 1,
): Promise<GooglePlace | undefined> {
  const response = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({ textQuery, pageSize }),
  });

  if (!response.ok) {
    throw new Error(`Google Places API request failed: ${response.status}`);
  }

  const data = (await response.json()) as GooglePlacesSearchResponse;
  return data.places?.[0];
}

/**
 * Resolves a text query to a Google place_id using the cheapest search SKU.
 */
export async function lookupPlaceId(
  textQuery: string,
): Promise<string | undefined> {
  const place = await textSearch(textQuery, PLACE_ID_SEARCH_MASK);
  return place?.id?.trim() || undefined;
}

/**
 * Text Search (IDs Only) + Place Details (Enterprise) for one-off CLI flows.
 * Cheaper than a single Enterprise + Atmosphere text search.
 */
export async function fetchBusinessByQuery(
  textQuery: string,
): Promise<RawBusinessData> {
  const placeId = await lookupPlaceId(textQuery);

  if (!placeId) {
    throw new Error(`No Google Places results found for "${textQuery}"`);
  }

  return getPlaceDetails(placeId, GENERATION_DETAILS_FIELD_MASK);
}

/**
 * @deprecated Use fetchBusinessByQuery or lookupPlaceId instead.
 */
export function createGooglePlacesSource(query: string): BusinessSource {
  return {
    async getBusiness() {
      return fetchBusinessByQuery(query);
    },
  };
}

export function rawBusinessFromLead(lead: LeadRecord): RawBusinessData {
  return {
    googlePlaceId: lead.googlePlaceId,
    name: lead.companyName,
    category: lead.industry,
    phone: lead.phone,
    address: lead.address,
    website: lead.existingWebsite,
    rating: lead.googleRating,
    reviewCount: lead.googleReviewCount,
  };
}

/**
 * Reuses lead-record fields from discovery and fetches only opening hours
 * via Place Details (Enterprise tier — same SKU as a full details call).
 */
export function createLeadEnrichedDetailsSource(
  lead: LeadRecord,
): BusinessSource {
  const googlePlaceId = lead.googlePlaceId?.trim();

  if (!googlePlaceId) {
    throw new Error("Lead has no Google Place ID");
  }

  return {
    async getBusiness() {
      const base = rawBusinessFromLead(lead);
      const details = await getPlaceDetails(
        googlePlaceId,
        OPENING_HOURS_DETAILS_MASK,
      );

      return {
        ...base,
        openingHours: details.openingHours,
      };
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type PlacesLocationBias = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export type PlacesSearchOptions = {
  locationBias?: PlacesLocationBias;
};

async function searchPage(
  textQuery: string,
  pageSize: number,
  pageToken?: string,
  locationBias?: PlacesLocationBias,
): Promise<GooglePlacesSearchResponse> {
  const response = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": DISCOVERY_FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      pageSize,
      ...(pageToken ? { pageToken } : {}),
      ...(locationBias
        ? {
            locationBias: {
              circle: {
                center: {
                  latitude: locationBias.latitude,
                  longitude: locationBias.longitude,
                },
                radius: locationBias.radiusMeters,
              },
            },
          }
        : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places API request failed: ${response.status}`);
  }

  return (await response.json()) as GooglePlacesSearchResponse;
}

/**
 * Returns up to `limit` businesses for a query, paging through Google's
 * 20-per-page results. Google caps any single query at 60 results.
 */
export async function searchPlaces(
  textQuery: string,
  limit: number,
  options: PlacesSearchOptions = {},
): Promise<RawBusinessData[]> {
  const target = Math.min(limit, MAX_RESULTS_PER_QUERY);
  const results: RawBusinessData[] = [];
  const seen = new Set<string>();

  let pageToken: string | undefined;

  while (results.length < target) {
    const pageSize = Math.min(MAX_PAGE_SIZE, target - results.length);

    if (pageToken) {
      await delay(PAGE_TOKEN_DELAY_MS);
    }

    const page = await searchPage(
      textQuery,
      pageSize,
      pageToken,
      options.locationBias,
    );

    const before = results.length;

    for (const place of page.places ?? []) {
      const business = mapPlaceToRawBusinessData(place);
      const id = business.googlePlaceId;

      // Pages can overlap; the same business must not be returned twice.
      if (id && seen.has(id)) {
        continue;
      }

      if (id) {
        seen.add(id);
      }

      results.push(business);
    }

    pageToken = page.nextPageToken;

    // Stop when Google stops paging, or when a page adds nothing new
    // (overlap / stale token) so we never spin forever below `target`.
    if (!pageToken || results.length === before) {
      break;
    }
  }

  return results.slice(0, target);
}

/**
 * Fetches place fields by place_id. Defaults to the legacy full mask;
 * prefer GENERATION_DETAILS_FIELD_MASK or OPENING_HOURS_DETAILS_MASK.
 */
export async function getPlaceDetails(
  googlePlaceId: string,
  fieldMask: string = DETAILS_FIELD_MASK,
): Promise<RawBusinessData> {
  const response = await fetch(`${PLACES_DETAILS_URL}/${googlePlaceId}`, {
    headers: {
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": fieldMask,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Google Place Details request failed for "${googlePlaceId}": ${response.status}`,
    );
  }

  return mapPlaceToRawBusinessData((await response.json()) as GooglePlace);
}

export function createPlaceDetailsSource(
  googlePlaceId: string,
): BusinessSource {
  return {
    async getBusiness() {
      return getPlaceDetails(googlePlaceId, GENERATION_DETAILS_FIELD_MASK);
    },
  };
}
