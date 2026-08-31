import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { replenishSmsLeads } from "../src/leads/replenish";

const root = resolve(__dirname, "..");
loadEnv({ path: resolve(root, ".env.local") });

async function main(): Promise<void> {
  console.log("SMS lead replenishment (manual). Does not commit or push.\n");

  const stats = await replenishSmsLeads();

  console.log(
    JSON.stringify(
      {
        actionableBefore: stats.actionableBefore,
        target: stats.target,
        needed: stats.needed,
        toGenerate: stats.toGenerate,
        candidatesDiscovered: stats.candidatesDiscovered,
        rejectedExistingWebsite: stats.rejectedExistingWebsite,
        rejectedMissingPhone: stats.rejectedMissingPhone,
        rejectedInvalidOrLandline: stats.rejectedInvalidOrLandline,
        duplicates: stats.duplicates,
        demosGenerated: stats.demosGenerated,
        actionableAfter: stats.actionableAfter,
        slotsTried: stats.slotsTried,
        slotsSkippedCooldown: stats.slotsSkippedCooldown,
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
      console.log(`… and ${stats.errors.length - 40} more`);
    }
  }

  if (stats.toGenerate === 0) {
    console.log("\nBacklog at or above target — nothing generated.");
  } else {
    console.log(
      "\nInspect generated leads under src/content/leads and src/content/clients, then commit manually when ready.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
