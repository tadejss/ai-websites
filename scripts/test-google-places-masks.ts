import {
  createLeadEnrichedDetailsSource,
  DETAILS_FIELD_MASK,
  DISCOVERY_FIELD_MASK,
  fetchBusinessByQuery,
  GENERATION_DETAILS_FIELD_MASK,
  lookupPlaceId,
  OPENING_HOURS_DETAILS_MASK,
  PLACE_ID_SEARCH_MASK,
  searchPlaces,
} from "../src/sources/google-places-source";

process.env.GOOGLE_PLACES_API_KEY ??= "test-key";

let failures = 0;

function check(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
  }
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

type CapturedRequest = {
  url: string;
  fieldMask?: string;
  method?: string;
};

function stubFetch(
  handler: (url: string, init?: RequestInit) => CapturedRequest | void,
): CapturedRequest[] {
  const calls: CapturedRequest[] = [];

  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const headers = init?.headers as Record<string, string> | undefined;
    const captured: CapturedRequest = {
      url,
      fieldMask: headers?.["X-Goog-FieldMask"],
      method: init?.method,
    };
    calls.push(captured);
    handler(url, init);

    if (url.includes(":searchText")) {
      return {
        ok: true,
        async json() {
          return {
            places: [{ id: "place-123" }],
          };
        },
      };
    }

    return {
      ok: true,
      async json() {
        return {
          id: "place-123",
          regularOpeningHours: {
            weekdayDescriptions: ["Monday: 9:00 AM – 5:00 PM"],
          },
        };
      },
    };
  }) as unknown as typeof fetch;

  return calls;
}

const realFetch = globalThis.fetch;

function maskHasAtmosphereFields(mask: string): boolean {
  return mask.includes("reviews") || mask.includes("editorialSummary");
}

async function main(): Promise<void> {
  console.log("== static mask assertions ==");

  check(
    "PLACE_ID_SEARCH_MASK is IDs only",
    PLACE_ID_SEARCH_MASK === "places.id",
  );
  check(
    "DISCOVERY_FIELD_MASK has no Atmosphere fields",
    !maskHasAtmosphereFields(DISCOVERY_FIELD_MASK),
  );
  check(
    "DISCOVERY_FIELD_MASK includes phone and website",
    DISCOVERY_FIELD_MASK.includes("nationalPhoneNumber")
      && DISCOVERY_FIELD_MASK.includes("websiteUri"),
  );
  check(
    "GENERATION_DETAILS_FIELD_MASK has opening hours",
    GENERATION_DETAILS_FIELD_MASK.includes("regularOpeningHours"),
  );
  check(
    "GENERATION_DETAILS_FIELD_MASK has no reviews",
    !GENERATION_DETAILS_FIELD_MASK.includes("reviews"),
  );
  check(
    "OPENING_HOURS_DETAILS_MASK is hours only",
    OPENING_HOURS_DETAILS_MASK === "regularOpeningHours",
  );
  check(
    "DETAILS_FIELD_MASK still includes legacy Atmosphere fields",
    DETAILS_FIELD_MASK.includes("reviews")
      && DETAILS_FIELD_MASK.includes("editorialSummary"),
  );

  console.log("\n== lookupPlaceId uses IDs-only search ==");

  const lookupCalls = stubFetch(() => {});
  await lookupPlaceId("frizer Ljubljana");
  check("lookupPlaceId makes one search request", lookupCalls.length === 1);
  check(
    "lookupPlaceId field mask is PLACE_ID_SEARCH_MASK",
    lookupCalls[0]?.fieldMask === PLACE_ID_SEARCH_MASK,
  );
  check(
    "lookupPlaceId does not request Atmosphere fields",
    !maskHasAtmosphereFields(lookupCalls[0]?.fieldMask ?? ""),
  );

  console.log("\n== fetchBusinessByQuery uses IDs search + generation details ==");

  const queryCalls = stubFetch(() => {});
  await fetchBusinessByQuery("frizer Ljubljana");
  check("fetchBusinessByQuery makes two requests", queryCalls.length === 2);
  check(
    "first request is Text Search IDs only",
    queryCalls[0]?.url.includes(":searchText")
      && queryCalls[0]?.fieldMask === PLACE_ID_SEARCH_MASK,
  );
  check(
    "second request is Place Details generation mask",
    queryCalls[1]?.url.includes("/places/place-123")
      && queryCalls[1]?.fieldMask === GENERATION_DETAILS_FIELD_MASK,
  );
  check(
    "generation details omit Atmosphere fields",
    !maskHasAtmosphereFields(queryCalls[1]?.fieldMask ?? ""),
  );

  console.log("\n== searchPlaces uses discovery mask ==");

  const discoveryCalls = stubFetch(() => {});
  await searchPlaces("frizer", 1);
  check("searchPlaces makes one search request", discoveryCalls.length === 1);
  check(
    "searchPlaces field mask is DISCOVERY_FIELD_MASK",
    discoveryCalls[0]?.fieldMask === DISCOVERY_FIELD_MASK,
  );

  console.log("\n== createLeadEnrichedDetailsSource reuses lead + hours only ==");

  const leadCalls = stubFetch(() => {});
  const source = createLeadEnrichedDetailsSource({
    slug: "test-salon",
    googlePlaceId: "place-456",
    companyName: "Test Salon",
    industry: "hair_salon",
    phone: "041 123 456",
    address: "Ljubljana",
    googleRating: "4.8",
    googleReviewCount: "12",
  });
  const business = await source.getBusiness();

  check("lead-enriched source makes one Details request", leadCalls.length === 1);
  check(
    "Details request uses OPENING_HOURS_DETAILS_MASK",
    leadCalls[0]?.fieldMask === OPENING_HOURS_DETAILS_MASK,
  );
  check("lead phone is preserved", business.phone === "041 123 456");
  check("opening hours come from Details", business.openingHours === "Monday: 9:00 AM – 5:00 PM");
}

main()
  .then(() => {
    globalThis.fetch = realFetch;
    console.log(
      failures === 0
        ? "\nAll Google Places mask checks passed."
        : `\n${failures} check(s) failed.`,
    );
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch((error) => {
    globalThis.fetch = realFetch;
    console.error(error);
    process.exit(1);
  });
