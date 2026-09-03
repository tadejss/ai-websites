import { hostname } from "node:os";
import { isDatabaseConfigured } from "@/db/client";
import { runQaAgent } from "./agent";
import { buildQaInput } from "./build-input";
import { getGrokQaConfig, isGrokQaEnabled } from "./config";
import { isQaRetryable, QaFatalError } from "./errors";
import { claimQaRunLease, releaseQaRunLease } from "./lease";
import {
  findCompletedQaRun,
  listDueQaRuns,
  markQaRunCompleted,
  markQaRunFailed,
  markQaRunRunning,
  markQaRunSkipped,
} from "./store";
import type { GrokStructuredClient, QaRunRecord } from "./types";

export type ProcessQaBatchResult = {
  processed: number;
  completed: number;
  failed: number;
  skipped: number;
  retried: number;
};

function backoffMs(attempt: number): number {
  return Math.min(30 * 60_000, Math.pow(2, Math.max(attempt, 1)) * 60_000);
}

export type ProcessQaDependencies = {
  runAgent?: typeof runQaAgent;
  client?: GrokStructuredClient;
};

export async function processQaRun(
  run: QaRunRecord,
  workerId: string,
  deps: ProcessQaDependencies = {},
): Promise<"completed" | "failed" | "skipped" | "retried"> {
  const config = getGrokQaConfig();
  const lease = await claimQaRunLease({
    slug: run.slug,
    workerId,
    leaseMinutes: config.leaseMinutes,
  });
  if (!lease) {
    return "skipped";
  }

  try {
    const claimed = await markQaRunRunning(run.id);
    if (!claimed) {
      return "skipped";
    }

    const completedSame = await findCompletedQaRun(run.slug, run.contentHash);
    if (completedSame && run.trigger !== "admin") {
      await markQaRunSkipped({
        id: run.id,
        reason: "completed QA already exists for this content hash",
      });
      return "skipped";
    }

    if (!config.enabled) {
      await markQaRunSkipped({ id: run.id, reason: "GROK_QA_ENABLED=false" });
      return "skipped";
    }

    if (!config.apiKey) {
      await markQaRunSkipped({
        id: run.id,
        reason: "XAI_API_KEY is not configured",
      });
      return "skipped";
    }

    const qaInput = await buildQaInput(run.slug);
    const agent = deps.runAgent ?? runQaAgent;
    const { result, usage } = deps.client
      ? await agent(qaInput, deps.client)
      : await agent(qaInput);

    await markQaRunCompleted({
      id: run.id,
      result,
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostUsd: usage.estimatedCostUsd,
    });
    return "completed";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const attempt = run.attempt + 1;
    const retryable =
      !(error instanceof QaFatalError) && isQaRetryable(error);
    const terminal = !retryable || attempt >= run.maxAttempts;

    await markQaRunFailed({
      id: run.id,
      error: message,
      attempt,
      retryAt: terminal ? null : new Date(Date.now() + backoffMs(attempt)),
      terminal,
    });
    return terminal ? "failed" : "retried";
  } finally {
    await releaseQaRunLease(run.slug, lease.runId);
  }
}

export async function processQaBatch(
  options: {
    limit?: number;
    workerId?: string;
  } = {},
  deps: ProcessQaDependencies = {},
): Promise<ProcessQaBatchResult> {
  const empty: ProcessQaBatchResult = {
    processed: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    retried: 0,
  };

  if (!isDatabaseConfigured() || !isGrokQaEnabled()) {
    return empty;
  }

  const config = getGrokQaConfig();
  const limit = options.limit ?? config.maxPerWorkerRun;
  const workerId =
    options.workerId ?? `qa-${hostname()}-${process.pid}`;
  const due = await listDueQaRuns(limit);
  const result = { ...empty, processed: due.length };

  for (const run of due) {
    const outcome = await processQaRun(run, workerId, deps);
    result[outcome] += 1;
  }

  return result;
}
