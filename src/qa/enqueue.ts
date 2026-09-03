import { randomUUID } from "node:crypto";
import { isDatabaseConfigured } from "@/db/client";
import { getGrokQaConfig, isGrokQaEnabled } from "./config";
import { hashQaContent } from "./content-hash";
import { loadGeneratedSite } from "./build-input";
import {
  findActiveQaRun,
  findCompletedQaRun,
  insertQaRun,
  shouldSkipAutomaticQa,
} from "./store";
import type { QaRunRecord, QaTrigger } from "./types";

export type EnqueueQaResult =
  | { outcome: "enqueued"; run: QaRunRecord }
  | { outcome: "skipped"; reason: string; run?: QaRunRecord };

export async function enqueueQaRun(input: {
  slug: string;
  trigger: QaTrigger;
  factoryRunId?: string | null;
  force?: boolean;
}): Promise<EnqueueQaResult> {
  if (!isDatabaseConfigured()) {
    return { outcome: "skipped", reason: "DATABASE_URL is not configured" };
  }
  if (!isGrokQaEnabled()) {
    return { outcome: "skipped", reason: "GROK_QA_ENABLED=false" };
  }

  let contentHash: string;
  try {
    const { site, business } = loadGeneratedSite(input.slug);
    contentHash = hashQaContent(site, business);
  } catch (error) {
    return {
      outcome: "skipped",
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  const force = Boolean(input.force);
  const completed = await findCompletedQaRun(input.slug, contentHash);
  if (
    shouldSkipAutomaticQa({
      completedHash: completed?.contentHash ?? null,
      contentHash,
      force,
    })
  ) {
    return {
      outcome: "skipped",
      reason: "completed QA already exists for this content hash",
      run: completed ?? undefined,
    };
  }

  if (!force) {
    const active = await findActiveQaRun(input.slug, contentHash);
    if (active) {
      return {
        outcome: "skipped",
        reason: "a pending or running QA run already exists for this content hash",
        run: active,
      };
    }
  }

  const config = getGrokQaConfig();
  const run = await insertQaRun({
    id: randomUUID(),
    slug: input.slug,
    contentHash,
    factoryRunId: input.factoryRunId ?? null,
    trigger: input.trigger,
    maxAttempts: config.maxAttempts,
  });

  return { outcome: "enqueued", run };
}

export async function enqueueQaRunSafe(input: {
  slug: string;
  trigger: QaTrigger;
  factoryRunId?: string | null;
}): Promise<void> {
  try {
    await enqueueQaRun(input);
  } catch (error) {
    console.error(
      "[grok-qa] enqueue failed",
      input.slug,
      error instanceof Error ? error.message : error,
    );
  }
}
