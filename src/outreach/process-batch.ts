import { readAllLeads } from "@/leads/store";
import { getOutreachConfig } from "./config";
import { getDueOutreachStep } from "./eligibility";
import { logOutreach } from "./logger";
import { sendOutreachToLead } from "./send";

export type ProcessBatchResult = {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  dryRun: boolean;
  results: Array<{
    slug: string;
    ok: boolean;
    step?: string;
    error?: string;
    skipped?: boolean;
  }>;
};

export async function processOutreachBatch(
  limit = getOutreachConfig().batchSize,
): Promise<ProcessBatchResult> {
  const config = getOutreachConfig();
  const leads = readAllLeads()
    .map((lead) => ({ lead, step: getDueOutreachStep(lead) }))
    .filter((entry) => entry.step !== null)
    .slice(0, limit);

  const result: ProcessBatchResult = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    dryRun: config.dryRun,
    results: [],
  };

  logOutreach({
    level: "info",
    event: "batch_start",
    details: { count: leads.length, dryRun: config.dryRun },
  });

  for (const { lead, step } of leads) {
    result.processed += 1;

    const sendResult = await sendOutreachToLead(lead.slug, { step: step ?? undefined });

    if (sendResult.ok) {
      result.sent += 1;
      result.results.push({
        slug: sendResult.slug,
        ok: true,
        step: sendResult.step,
      });
      continue;
    }

    if (sendResult.skipped) {
      result.skipped += 1;
      result.results.push({
        slug: sendResult.slug,
        ok: false,
        error: sendResult.error,
        skipped: true,
      });
      continue;
    }

    result.failed += 1;
    result.results.push({
      slug: sendResult.slug,
      ok: false,
      error: sendResult.error,
    });
  }

  logOutreach({
    level: "info",
    event: "batch_complete",
    details: {
      processed: result.processed,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
      dryRun: result.dryRun,
    },
  });

  return result;
}
