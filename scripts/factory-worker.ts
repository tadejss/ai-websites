import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { isDatabaseConfigured } from "../src/db/client";
import { getRecentWorkerRuns } from "../src/factory/lease";
import { runFactoryWorker } from "../src/factory/worker";
import { getReplenishStatus } from "../src/leads/replenish-status";

const root = resolve(__dirname, "..");
loadEnv({ path: resolve(root, ".env.local") });

async function printStatus(): Promise<void> {
  const backlog = await getReplenishStatus();
  console.log("Factory worker status\n");
  console.log(
    JSON.stringify(
      {
        actionable: backlog.actionable,
        target: backlog.target,
        needed: backlog.needed,
        batch: backlog.batch,
        databaseConfigured: isDatabaseConfigured(),
      },
      null,
      2,
    ),
  );

  if (!isDatabaseConfigured()) {
    console.log("\nDATABASE_URL not set — cannot load recent worker runs.");
    return;
  }

  const runs = await getRecentWorkerRuns(8);
  console.log("\nRecent runs:");
  for (const run of runs) {
    console.log(
      `- ${run.startedAt} ${run.status} gen=${run.demosGenerated} pub=${run.demosPublished} fail=${run.demosFailed} trigger=${run.triggerSource}${run.error ? ` err=${run.error.slice(0, 80)}` : ""}`,
    );
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--status")) {
    await printStatus();
    return;
  }

  if (!isDatabaseConfigured()) {
    console.error(
      "DATABASE_URL is required for the factory worker (Neon). Use npm run replenish-leads for local file-only generation.",
    );
    process.exit(1);
  }

  const force = args.includes("--force");
  const triggerSource =
    process.env.FACTORY_TRIGGER_SOURCE?.trim()
    || (process.env.GITHUB_ACTIONS === "true" ? "github_action" : "manual");

  console.log(
    `Factory worker starting (trigger=${triggerSource}${force ? ", force" : ""})\n`,
  );

  const result = await runFactoryWorker({
    triggerSource,
    force,
  });

  console.log(
    JSON.stringify(
      {
        status: result.status,
        runId: result.runId,
        skipped: result.skipped,
        skipReason: result.skipReason,
        metrics: result.metrics,
        publish: result.publish
          ? {
              outcome: result.publish.outcome,
              ...(result.publish.outcome === "published"
                ? {
                    commitSha: result.publish.commitSha,
                    filesChanged: result.publish.filesChanged,
                    slugs: result.publish.slugs,
                  }
                : result.publish.outcome === "noop"
                  ? { reason: result.publish.reason }
                  : { error: result.publish.error }),
            }
          : null,
        replenish: result.replenish
          ? {
              demosGenerated: result.replenish.demosGenerated,
              needed: result.replenish.needed,
              toGenerate: result.replenish.toGenerate,
              runStopReason: result.replenish.runStopReason,
              errorCount: result.replenish.errors.length,
            }
          : null,
        error: result.error,
      },
      null,
      2,
    ),
  );

  if (result.status === "failed") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
