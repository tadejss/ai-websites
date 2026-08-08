import type { RawBusinessData } from "@/ai/types/raw-business-data";
import type { BusinessSource } from "./types";

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
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
