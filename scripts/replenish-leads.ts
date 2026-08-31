import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { isDatabaseConfigured } from "../src/db/client";
import {
  formatProgressStatus,
  readDiscoveryProgress,
  resetDiscoveryProgress,
} from "../src/leads/discovery-progress";
import {
  loadDiscoveryProgress,
  resetDiscoveryProgressStore,
  saveDiscoveryProgress,
} from "../src/factory/discovery-progress-store";
import { replenishSmsLeads } from "../src/leads/replenish";

const root = resolve(__dirname, "..");
loadEnv({ path: resolve(root, ".env.local") });

async function printStatus(): Promise<void> {
  const progress = isDatabaseConfigured()
    ? await loadDiscoveryProgress()
    : readDiscoveryProgress();
  const status = formatProgressStatus(progress);

  console.log(
    `Discovery matrix status (${isDatabaseConfigured() ? "Neon" : "local file"})\n`,
  );
  console.log(`Current: ${status.currentRegion} / ${status.currentProfession}`);
  console.log(
    `Combinations: ${status.combinationsCompleted}/${status.combinationsTotal} completed`,
  );
  if (status.nextRegion && status.nextProfession) {
    console.log(`Next pointer: ${status.nextRegion} / ${status.nextProfession}`);
  }

  const active = status.combinations.find(
    (entry) =>
      entry.key === `${status.currentRegionId}:${status.currentProfessionId}`,
  );
  if (active) {
    console.log(
      `\nActive cell queries: ${active.queriesCompleted}/${active.queriesPlanned}`,
    );
    if (active.completionReason) {
      console.log(`Completion reason: ${active.completionReason}`);
    }
  }

  const byRegion = new Map<string, { completed: number; newLeads: number }>();
  for (const entry of status.combinations) {
    const regionId = entry.key.split(":")[0] ?? "unknown";
    const bucket = byRegion.get(regionId) ?? { completed: 0, newLeads: 0 };
    if (entry.status === "completed") {
      bucket.completed += 1;
    }
    bucket.newLeads += entry.newLeads;
    byRegion.set(regionId, bucket);
  }

  console.log("\nPer-region yield:");
  for (const [regionId, totals] of byRegion) {
    console.log(
      `- ${regionId}: ${totals.newLeads} new leads, ${totals.completed}/16 combos done`,
    );
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--status")) {
    await printStatus();
    return;
  }

  if (args.includes("--reset")) {
    if (!args.includes("--confirm")) {
      console.error(
        "Refusing to reset discovery progress without --reset --confirm",
      );
      process.exit(1);
    }
    if (isDatabaseConfigured()) {
      await resetDiscoveryProgressStore();
      console.log("Reset discovery progress in Neon (+ local file mirror)");
    } else {
      resetDiscoveryProgress();
      console.log("Deleted data/lead-discovery-progress.json");
    }
    return;
  }

  console.log("SMS lead replenishment (manual). Does not commit or push.\n");
  if (isDatabaseConfigured()) {
    console.log(
      "Using Neon-backed discovery progress (shared with factory worker).\n",
    );
  } else {
    console.log(
      "Using local data/lead-discovery-progress.json (no DATABASE_URL).\n",
    );
  }

  const stats = await replenishSmsLeads({
    ...(isDatabaseConfigured()
      ? {
          readProgress: () => loadDiscoveryProgress(),
          writeProgress: (progress: Parameters<typeof saveDiscoveryProgress>[0]) =>
            saveDiscoveryProgress(progress),
        }
      : {}),
    onQueryComplete: (queryStats) => {
      console.log(`Region: ${queryStats.region}`);
      console.log(`Profession: ${queryStats.profession}`);
      console.log(`Query: ${queryStats.query}`);
      console.log(`New candidates: ${queryStats.newCandidates}`);
      console.log(`Rejected website: ${queryStats.rejectedWebsite}`);
      console.log(`Rejected non-mobile: ${queryStats.rejectedNonMobile}`);
      console.log(`Duplicates: ${queryStats.duplicates}`);
      console.log("");
    },
  });

  console.log(
    JSON.stringify(
      {
        actionableBefore: stats.actionableBefore,
        target: stats.target,
        needed: stats.needed,
        toGenerate: stats.toGenerate,
        demosGenerated: stats.demosGenerated,
        candidatesDiscovered: stats.candidatesDiscovered,
        queriesAttempted: stats.queriesAttempted,
        queriesCompleted: stats.queriesCompleted,
        region: stats.region,
        profession: stats.profession,
        nextRegion: stats.nextRegion,
        nextProfession: stats.nextProfession,
        runStopReason: stats.runStopReason,
        rejectedExistingWebsite: stats.rejectedExistingWebsite,
        rejectedMissingPhone: stats.rejectedMissingPhone,
        rejectedInvalidOrLandline: stats.rejectedInvalidOrLandline,
        duplicates: stats.duplicates,
        actionableAfter: stats.actionableAfter,
        errorCount: stats.errors.length,
      },
      null,
      2,
    ),
  );

  if (stats.errors.length > 0) {
    console.log("\nErrors:");
    for (const error of stats.errors.slice(0, 40)) {
      console.log(`- ${error}`);
    }
    if (stats.errors.length > 40) {
      console.log(`… and ${stats.errors.length} more`);
    }
  }

  if (stats.toGenerate === 0) {
    console.log("\nBacklog at or above target — nothing generated.");
  } else {
    console.log(
      "\nInspect generated leads under src/content/leads and src/content/clients, then commit manually when ready.",
    );
    console.log(
      "Or use npm run factory-worker to generate and publish automatically.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
