/**
 * Isolate pre-LIVE queued/claimed SMS from the automated campaign.
 *
 * Does NOT delete rows. Does NOT send SMS. Does NOT start the poller.
 *
 * Usage:
 *   npx tsx scripts/sms-isolate-pre-live-queue.ts --dry-run
 *   npx tsx scripts/sms-isolate-pre-live-queue.ts --apply
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const apply = process.argv.includes("--apply");
  if ([dryRun, apply].filter(Boolean).length !== 1) {
    console.error(
      "Usage: tsx scripts/sms-isolate-pre-live-queue.ts --dry-run | --apply",
    );
    process.exit(1);
  }

  const { isDatabaseConfigured, sql } = await import("../src/db/client");
  const { ensureCustomerSchema } = await import("../src/db/ensure-schema");
  const { cancelNonLiveInFlightMessages, countSmsMessagesByStatuses } =
    await import("../src/outreach/sms/store");

  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL required");
  }
  await ensureCustomerSchema();
  const db = sql();

  const before = await countSmsMessagesByStatuses([
    "queued",
    "claimed",
    "sending",
    "cancelled",
  ]);

  const candidates = (await db`
    SELECT COUNT(*)::int AS count
    FROM sms_messages
    WHERE live_eligible = FALSE
      AND status IN ('queued', 'claimed')
  `) as Array<{ count: number }>;

  const liveQueued = (await db`
    SELECT COUNT(*)::int AS count
    FROM sms_messages
    WHERE live_eligible = TRUE
      AND status IN ('queued', 'claimed', 'sending')
  `) as Array<{ count: number }>;

  console.log("=== PRE-LIVE QUEUE ISOLATION ===");
  console.log("before:", before);
  console.log("non-live queued/claimed candidates:", candidates[0]?.count ?? 0);
  console.log("live-eligible in-flight:", liveQueued[0]?.count ?? 0);

  if (dryRun) {
    console.log("DRY-RUN only — no UPDATE performed.");
    return;
  }

  const cancelled = await cancelNonLiveInFlightMessages({
    reason: "pre_live_isolation",
  });
  const after = await countSmsMessagesByStatuses([
    "queued",
    "claimed",
    "sending",
    "cancelled",
  ]);
  console.log(`cancelled=${cancelled}`);
  console.log("after:", after);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
