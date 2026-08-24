import type { RawBusinessData } from "@/ai/types/raw-business-data";
import type { BusinessSource } from "./types";

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.primaryType",
  "places.types",
  "places.editorialSummary",
  "places.nationalPhoneNumber",
  "places.formattedAddress",
  "places.websiteUri",
  "places.regularOpeningHours",
  "places.rating",
  "places.userRatingCount",
  "places.reviews",
].join(",");

/**
 * Discovery deliberately omits reviews, editorial summaries and opening hours.
 * Those fields move the request into a more expensive Places billing tier, and
 * discovery pulls up to 60 businesses per query where generation pulls one.
 * The full detail is fetched later, only for businesses we decide to generate.
 */
const DISCOVERY_FIELD_MASK = [
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

const DETAILS_FIELD_MASK = [
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

async function searchPlace(textQuery: string): Promise<GooglePlace> {
  const response = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery }),
  });

  if (!response.ok) {
    throw new Error(`Google Places API request failed: ${response.status}`);
  }

  const data = (await response.json()) as GooglePlacesSearchResponse;
  const place = data.places?.[0];

  if (!place) {
    throw new Error(`No Google Places results found for "${textQuery}"`);
  }

  return place;
}

export function createGooglePlacesSource(query: string): BusinessSource {
  return {
    async getBusiness() {
      const place = await searchPlace(query);
      return mapPlaceToRawBusinessData(place);
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
 * Fetches the full field set for one business by Place ID. Used at generation
 * time so reviews and opening hours are only paid for when they are needed.
 */
export async function getPlaceDetails(
  googlePlaceId: string,
): Promise<RawBusinessData> {
  const response = await fetch(`${PLACES_DETAILS_URL}/${googlePlaceId}`, {
    headers: {
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": DETAILS_FIELD_MASK,
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
      return getPlaceDetails(googlePlaceId);
    },
  };
}
