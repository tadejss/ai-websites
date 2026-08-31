import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  allHighValueCompleted,
  buildSearchSurface,
  combinationKey,
  nextQueryInSurface,
} from "../src/leads/discovery-matrix";
import {
  completedQuerySet,
  createInitialProgress,
  markQueryCompleted,
  readDiscoveryProgress,
  setCombinationProgress,
  writeDiscoveryProgress,
  type DiscoveryProgress,
} from "../src/leads/discovery-progress";
import { replenishSmsLeads } from "../src/leads/replenish";

let failures = 0;

function ok(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
  }
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

function seedActiveCombo(
  regionId: "zasavska" = "zasavska",
  professionId: "frizerji" = "frizerji",
  completedQueries: string[] = [],
): DiscoveryProgress {
  let progress = createInitialProgress();
  progress = {
    ...progress,
    currentRegionId: regionId,
    currentProfessionId: professionId,
  };
  const surface = buildSearchSurface(regionId, professionId);
  const combo = {
    status: "active" as const,
    highValueQueries: surface.highValueQueries,
    optionalQueries: surface.optionalQueries,
    queriesCompleted: [...completedQueries],
    queriesAttempted: completedQueries.length,
    zeroYieldStreak: 0,
    newLeads: 0,
    actionableLeads: 0,
    rawPlacesProcessed: 0,
    rejectedWebsite: 0,
    rejectedNonMobile: 0,
    duplicates: 0,
  };
  return setCombinationProgress(progress, regionId, professionId, combo);
}

function mockDiscoverResults() {
  return async (
    _query: string,
    _limit: number,
    options?: { requireMobilePhone?: boolean },
  ) => {
    ok(
      options?.requireMobilePhone === true,
      "discover called with requireMobilePhone",
    );
    return [
      {
        outcome: "skipped" as const,
        reason: "already known",
        companyName: "Dup",
        googlePlaceId: "dup-1",
      },
      {
        outcome: "skipped" as const,
        reason: "already has a website",
        companyName: "WebCo",
        googlePlaceId: "web-1",
      },
      {
        outcome: "skipped" as const,
        reason: "no valid Slovenian mobile phone",
        companyName: "Land",
        googlePlaceId: "land-1",
      },
      {
        outcome: "discovered" as const,
        slug: "lead-good",
        companyName: "Good Salon",
        googlePlaceId: "good-1",
      },
    ];
  };
}

async function runTests(): Promise<void> {
  // 5 — town queries in surface
  const zasavskaFrizer = buildSearchSurface("zasavska", "frizerji");
  ok(
    zasavskaFrizer.highValueQueries.some((query) =>
      query.toLowerCase().includes("trbovlje"),
    ),
    "Zasavska surface includes Trbovlje",
  );

  // 3 — deterministic order
  const again = buildSearchSurface("zasavska", "frizerji");
  ok(
    JSON.stringify(again.highValueQueries)
      === JSON.stringify(zasavskaFrizer.highValueQueries),
    "deterministic query order within combination",
  );
  ok(
    again.highValueQueries[0]?.startsWith("frizer Zasavska"),
    "regional query comes first",
  );

  // 12 — progress file survives read/write
  const tempDir = mkdtempSync(join(tmpdir(), "discovery-progress-"));
  const progressPath = join(tempDir, "lead-discovery-progress.json");
  const initial = createInitialProgress();
  writeDiscoveryProgress(initial, progressPath);
  const reloaded = readDiscoveryProgress(progressPath);
  ok(reloaded.version === 1, "progress file round-trip version");
  ok(
    Object.keys(reloaded.combinations).length === 192,
    "progress file round-trip combinations",
  );
  rmSync(tempDir, { recursive: true, force: true });

  // 2 — completed queries skipped
  const surface = buildSearchSurface("zasavska", "frizerji");
  const firstQuery = surface.highValueQueries[0]!;
  let progress = seedActiveCombo("zasavska", "frizerji", [firstQuery]);
  const queried: string[] = [];
  await replenishSmsLeads({
    countActionable: async () => 100,
    maxSearchesPerRun: 2,
    zeroYieldCompletionStreak: 99,
    readProgress: () => progress,
    writeProgress: (next) => {
      progress = next;
    },
    discover: async (query) => {
      queried.push(query);
      ok(query !== firstQuery, "completed query not re-run");
      return [];
    },
    readLeadBySlug: () => null,
    siteExists: () => false,
    createFromLead: async () => ({
      outcome: "created",
      slug: "x",
      companyName: "x",
    }),
  });
  ok(queried.length === 2, "skipped completed query, ran next two");

  // 1 — resume mid-combination
  progress = seedActiveCombo("zasavska", "frizerji", [
    surface.highValueQueries[0]!,
    surface.highValueQueries[1]!,
  ]);
  const resumeQueries: string[] = [];
  await replenishSmsLeads({
    countActionable: async () => 100,
    maxSearchesPerRun: 1,
    zeroYieldCompletionStreak: 99,
    readProgress: () => progress,
    writeProgress: (next) => {
      progress = next;
    },
    discover: async (query) => {
      resumeQueries.push(query);
      return [];
    },
    readLeadBySlug: () => null,
    siteExists: () => false,
    createFromLead: async () => ({
      outcome: "created",
      slug: "x",
      companyName: "x",
    }),
  });
  ok(
    resumeQueries[0] === surface.highValueQueries[2],
    "resume from saved progress mid-combination",
  );

  // 6–8 — rejection counters from discover results
  progress = createInitialProgress();
  progress = {
    ...progress,
    currentRegionId: "zasavska",
    currentProfessionId: "frizerji",
  };
  const rejectionStats = await replenishSmsLeads({
    countActionable: async () => 100,
    maxSearchesPerRun: 1,
    zeroYieldCompletionStreak: 99,
    readProgress: () => progress,
    writeProgress: (next) => {
      progress = next;
    },
    discover: mockDiscoverResults(),
    readLeadBySlug: (slug) =>
      slug === "lead-good"
        ? { slug, phone: "041 696 401", existingWebsite: "" }
        : null,
    siteExists: () => false,
    createFromLead: async (slug) => ({
      outcome: "created",
      slug,
      companyName: slug,
    }),
  });
  ok(rejectionStats.duplicates >= 1, "duplicate place ID rejection");
  ok(
    rejectionStats.rejectedExistingWebsite >= 1,
    "website rejection counted",
  );
  ok(
    rejectionStats.rejectedInvalidOrLandline >= 1,
    "landline rejection counted",
  );

  // 9 — re-run does not re-query completed searches
  const key = combinationKey("zasavska", "frizerji");
  const comboAfter = progress.combinations[key]!;
  const completedCount = comboAfter.queriesCompleted.length;
  const secondRunQueries: string[] = [];
  await replenishSmsLeads({
    countActionable: async () => 100,
    maxSearchesPerRun: 5,
    zeroYieldCompletionStreak: 99,
    readProgress: () => progress,
    writeProgress: (next) => {
      progress = next;
    },
    discover: async (query) => {
      secondRunQueries.push(query);
      return [];
    },
    readLeadBySlug: () => null,
    siteExists: () => false,
    createFromLead: async () => ({
      outcome: "created",
      slug: "x",
      companyName: "x",
    }),
  });
  ok(
    progress.combinations[key]!.queriesCompleted.length >= completedCount,
    "progress retained completed queries after run",
  );
  for (const done of comboAfter.queriesCompleted) {
    ok(!secondRunQueries.includes(done), "re-run skips completed searches");
  }

  // 10 — next run continues from saved pointer
  const pointerBefore = {
    region: progress.currentRegionId,
    profession: progress.currentProfessionId,
  };
  await replenishSmsLeads({
    countActionable: async () => 100,
    maxSearchesPerRun: 1,
    zeroYieldCompletionStreak: 99,
    readProgress: () => progress,
    writeProgress: (next) => {
      progress = next;
    },
    discover: async () => [],
    readLeadBySlug: () => null,
    siteExists: () => false,
    createFromLead: async () => ({
      outcome: "created",
      slug: "x",
      companyName: "x",
    }),
  });
  ok(
    progress.currentRegionId === pointerBefore.region
      || progress.currentProfessionId !== pointerBefore.profession
      || progress.combinations[key]!.queriesCompleted.length > completedCount,
    "next run continues from saved pointer",
  );

  // 11 — toGenerate batch cap respected
  let demos = 0;
  progress = createInitialProgress();
  progress = {
    ...progress,
    currentRegionId: "zasavska",
    currentProfessionId: "frizerji",
  };
  const capped = await replenishSmsLeads({
    countActionable: async () => 499,
    maxSearchesPerRun: 20,
    zeroYieldCompletionStreak: 99,
    readProgress: () => progress,
    writeProgress: (next) => {
      progress = next;
    },
    discover: async () => [
      {
        outcome: "discovered",
        slug: `lead-${demos}`,
        companyName: `Lead ${demos}`,
        googlePlaceId: `p-${demos}`,
      },
    ],
    readLeadBySlug: (slug) => ({
      slug,
      phone: "041 696 401",
      existingWebsite: "",
    }),
    siteExists: () => false,
    createFromLead: async (slug) => {
      demos += 1;
      return { outcome: "created", slug, companyName: slug };
    },
  });
  ok(capped.toGenerate === 1, "toGenerate capped to gap");
  ok(capped.demosGenerated <= capped.toGenerate, "batch cap respected");

  // 4 — combination completes after all high-value queries when zero streak high
  progress = createInitialProgress();
  progress = {
    ...progress,
    currentRegionId: "zasavska",
    currentProfessionId: "frizerji",
  };
  const highValueCount = zasavskaFrizer.highValueQueries.length;
  await replenishSmsLeads({
    countActionable: async () => 500,
    maxSearchesPerRun: highValueCount + 2,
    zeroYieldCompletionStreak: 99,
    readProgress: () => progress,
    writeProgress: (next) => {
      progress = next;
    },
    discover: async () => [],
    readLeadBySlug: () => null,
    siteExists: () => false,
    createFromLead: async () => ({
      outcome: "created",
      slug: "x",
      companyName: "x",
    }),
  });
  const finished = progress.combinations[key]!;
  ok(finished.status === "completed", "combination marked completed");
  ok(
    allHighValueCompleted(zasavskaFrizer, completedQuerySet(finished)),
    "all high-value queries completed",
  );

  // markQueryCompleted unit behavior
  let combo = seedActiveCombo().combinations[key]!;
  combo = markQueryCompleted(combo, "frizer Trbovlje", 0);
  combo = markQueryCompleted(combo, "frizer Trbovlje", 0);
  ok(combo.queriesCompleted.length === 1, "query completion deduped");
  ok(combo.zeroYieldStreak === 2, "zero yield streak increments");

  const next = nextQueryInSurface(
    zasavskaFrizer,
    completedQuerySet(combo),
  );
  ok(next !== "frizer Trbovlje", "next query skips completed");
}

runTests()
  .then(() => {
    if (failures > 0) {
      console.error(`\n${failures} test(s) failed`);
      process.exit(1);
    }
    console.log("\nAll discovery matrix tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
