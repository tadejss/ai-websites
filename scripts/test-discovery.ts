import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { uniqueSlug } from "../src/clients/slug";
import { discoverLeads } from "../src/leads/discover";
import { getLeadPriority } from "../src/leads/priority";
import { selectLeads } from "../src/leads/select";
import { LEAD_STATUSES } from "../src/leads/statuses";
import { readLead, saveLead } from "../src/leads/store";
import { searchPlaces } from "../src/sources/google-places-source";

// Google is stubbed below; the key only has to exist for the guard clause.
process.env.GOOGLE_PLACES_API_KEY ??= "test-key";

const leadsDir = resolve(__dirname, "../src/content/leads");

let failures = 0;
const createdSlugs = new Set<string>();

function check(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
  }
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

function trackTempLead(slug: string): void {
  createdSlugs.add(slug);
}

function cleanUp(): void {
  for (const slug of createdSlugs) {
    const path = resolve(leadsDir, `${slug}.json`);
    if (existsSync(path)) {
      rmSync(path);
    }
  }
}

type FakePlace = { id: string; name: string; website?: string };

function fakePlace(place: FakePlace) {
  return {
    id: place.id,
    displayName: { text: place.name },
    primaryType: "hair_salon",
    nationalPhoneNumber: "01 234 5678",
    formattedAddress: "Neka ulica 1, 1000 Ljubljana",
    websiteUri: place.website,
    rating: 4.6,
    userRatingCount: 25,
  };
}

/** Stands in for Google so pagination can be exercised without an API key. */
function stubFetch(pages: Array<{ places: FakePlace[]; nextPageToken?: string }>) {
  const calls: Array<Record<string, unknown>> = [];

  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    const body = JSON.parse(init.body) as Record<string, unknown>;
    calls.push(body);

    const index = body.pageToken
      ? pages.findIndex((page) => page.nextPageToken === body.pageToken) + 1
      : 0;
    const page = pages[index] ?? { places: [] };

    return {
      ok: true,
      async json() {
        return {
          places: page.places.map(fakePlace),
          nextPageToken: page.nextPageToken,
        };
      },
    };
  }) as unknown as typeof fetch;

  return calls;
}

const realFetch = globalThis.fetch;

async function main(): Promise<void> {
  console.log("== paginated search ==");

  let calls = stubFetch([
    {
      places: [
        { id: "p1", name: "Salon Ena" },
        { id: "p2", name: "Salon Dva" },
      ],
      nextPageToken: "token-1",
    },
    { places: [{ id: "p3", name: "Salon Tri" }] },
  ]);

  const paged = await searchPlaces("frizer Ljubljana", 50);

  check("results from both pages are returned", paged.length === 3);
  check(
    "place ids are mapped",
    paged.map((p) => p.googlePlaceId).join(",") === "p1,p2,p3",
  );
  check("second request carries the page token", calls[1]?.pageToken === "token-1");
  check("pagination stops when no token comes back", calls.length === 2);

  calls = stubFetch([
    { places: [{ id: "a1", name: "Ena" }, { id: "a2", name: "Dva" }] },
  ]);
  const limited = await searchPlaces("frizer", 1);
  check("limit is respected", limited.length === 1);
  check("pageSize never exceeds 20", Number(calls[0]?.pageSize) <= 20);

  calls = stubFetch([
    { places: [{ id: "d1", name: "Ista" }], nextPageToken: "t" },
    { places: [{ id: "d1", name: "Ista" }] },
  ]);
  const deduped = await searchPlaces("frizer", 50);
  check("a business repeated across pages appears once", deduped.length === 1);

  console.log("\n== discovery writes leads without generating ==");

  stubFetch([
    {
      places: [
        { id: "disc-1", name: "Frizer Testko" },
        { id: "disc-2", name: "Frizer Testko", website: "https://example.si" },
      ],
    },
  ]);

  const results = await discoverLeads("frizer test", 10);
  for (const result of results) {
    if (result.outcome === "discovered") {
      trackTempLead(result.slug);
    }
  }

  check("both businesses discovered", results.length === 2);

  const slugs = results
    .filter((r) => r.outcome === "discovered")
    .map((r) => (r as { slug: string }).slug);

  check(
    `same-name businesses get distinct slugs (${slugs.join(", ")})`,
    slugs.length === 2 && slugs[0] !== slugs[1],
  );

  const firstLead = readLead(slugs[0]);
  check("lead is written with discovered status", firstLead?.status === "discovered");
  check("no demo url yet", firstLead?.url === "");
  check("place id stored", firstLead?.googlePlaceId === "disc-1");

  console.log("\n== rediscovery skips known businesses ==");

  stubFetch([{ places: [{ id: "disc-1", name: "Frizer Testko" }] }]);
  const again = await discoverLeads("frizer test", 10);
  check(
    "known place id is skipped",
    again.length === 1 && again[0].outcome === "skipped",
  );

  console.log("\n== status transitions ==");

  check("discovered is a known status", LEAD_STATUSES.includes("discovered"));

  saveLead({ slug: slugs[0], status: "generated", url: `/${slugs[0]}` });
  check(
    "generating moves discovered to generated",
    readLead(slugs[0])?.status === "generated",
  );

  const soldSlug = "tmp-discovery-sold";
  trackTempLead(soldSlug);
  saveLead({ slug: soldSlug, status: "contacted", companyName: "Sold Biz" });
  saveLead({ slug: soldSlug, status: "generated", companyName: "Sold Biz" });
  check(
    "generating never overwrites a contacted lead",
    readLead(soldSlug)?.status === "contacted",
  );

  console.log("\n== lead selection ==");

  const withWebsiteSlug = slugs[1];
  const withWebsite = readLead(withWebsiteSlug);

  check(
    "the second business kept its website",
    Boolean(withWebsite?.existingWebsite),
  );
  check(
    "priority is computed for discovered leads",
    ["A", "B", "C", "D"].includes(getLeadPriority(withWebsite ?? { slug: "" })),
  );

  const noWebsite = selectLeads({
    statuses: ["discovered"],
    withoutWebsiteOnly: true,
  });
  check(
    "--no-website excludes leads that already have one",
    !noWebsite.some((lead) => lead.slug === withWebsiteSlug),
  );

  const onlyA = selectLeads({ statuses: ["discovered"], priorities: ["A"] });
  check(
    "priority filter only returns matching leads",
    onlyA.every((lead) => getLeadPriority(lead) === "A"),
  );

  const sorted = selectLeads({});
  const order = sorted.map((lead) => getLeadPriority(lead));
  check(
    `selection is sorted best-first (${order.join(",")})`,
    order.every((priority, index) => index === 0 || order[index - 1] <= priority),
  );

  console.log("\n== unique slugs ==");

  const taken = new Set(["frizer-ana", "frizer-ana-2"]);
  check(
    "first free suffix is used",
    uniqueSlug("frizer-ana", (slug) => taken.has(slug)) === "frizer-ana-3",
  );
  check(
    "an unused slug is left alone",
    uniqueSlug("frizer-bine", (slug) => taken.has(slug)) === "frizer-bine",
  );
}

main()
  .then(() => {
    globalThis.fetch = realFetch;
    cleanUp();
    console.log(
      failures === 0
        ? "\nAll discovery checks passed."
        : `\n${failures} check(s) failed.`,
    );
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch((error) => {
    globalThis.fetch = realFetch;
    cleanUp();
    console.error(error);
    process.exit(1);
  });
