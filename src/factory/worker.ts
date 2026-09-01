import { hostname } from "node:os";
import { createClientFromLead } from "@/clients/create-client-from-lead";
import { clientSiteExists } from "@/leads/client-exists";
import { replenishSmsLeads, type ReplenishStats } from "@/leads/replenish";
import { readLead } from "@/leads/store";
import { getFactoryWorkerConfig } from "./config";
import {
  loadDiscoveryProgress,
  saveDiscoveryProgress,
} from "./discovery-progress-store";
import {
  markGenerationLock,
  releaseGenerationLock,
  releaseGenerationLocksForRun,
  releaseStaleGeneratedLockIfNoClient,
  releaseStaleGeneratedLocksWithoutClient,
  tryAcquireGenerationLock,
  markGeneratedSlugsPublished,
} from "./generation-lock";
import {
  claimWorkerLease,
  countConsecutiveFailures,
  minutesSinceLastFailure,
  releaseWorkerLease,
  shouldSkipForCooldown,
  updateWorkerLeaseStatus,
  updateWorkerRun,
  type WorkerRunStatus,
} from "./lease";
import { publishGeneratedDemos, type PublishResult } from "./publish";

export type FactoryWorkerResult = {
  status: WorkerRunStatus;
  runId: string | null;
  skipped: boolean;
  skipReason?: string;
  replenish: ReplenishStats | null;
  publish: PublishResult | null;
  metrics: {
    demosGenerated: number;
    demosPublished: number;
    demosFailed: number;
    actionableBefore: number | null;
    actionableAfter: number | null;
    needed: number | null;
  };
  error?: string;
};

export type FactoryWorkerOptions = {
  triggerSource?: string;
  workerId?: string;
  force?: boolean;
  /** Injected for tests. */
  runReplenish?: typeof replenishSmsLeads;
  runPublish?: typeof publishGeneratedDemos;
  claimLease?: typeof claimWorkerLease;
  releaseLease?: typeof releaseWorkerLease;
};

function log(message: string, extra?: Record<string, unknown>): void {
  if (extra) {
    console.log(`[factory-worker] ${message}`, JSON.stringify(extra));
  } else {
    console.log(`[factory-worker] ${message}`);
  }
}

async function debugWorkerLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
): Promise<void> {
  // #region agent log
  try {
    await fetch("http://127.0.0.1:7813/ingest/557e1e51-3235-4136-a53b-709aeb57898b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b2aa8f",
      },
      body: JSON.stringify({
        sessionId: "b2aa8f",
        runId: process.env.GITHUB_ACTIONS === "true" ? "gha" : "local",
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // ignore ingest failures
  }
  // #endregion
  if (process.env.GITHUB_ACTIONS === "true") {
    console.log(`::notice::${message} ${JSON.stringify(data)}`);
  }
}

async function createFromLeadWithLock(
  slug: string,
  runId: string,
): Promise<Awaited<ReturnType<typeof createClientFromLead>>> {
  let acquired = await tryAcquireGenerationLock(slug, runId);
  if (!acquired && !clientSiteExists(slug)) {
    const released = await releaseStaleGeneratedLockIfNoClient(slug);
    if (released) {
      await debugWorkerLog(
        "B",
        "src/factory/worker.ts:createFromLeadWithLock",
        "released stale generated lock",
        { slug },
      );
      acquired = await tryAcquireGenerationLock(slug, runId);
    }
  }
  if (!acquired) {
    const lead = readLead(slug);
    return {
      outcome: "skipped",
      reason: "generation lock held (duplicate prevention)",
      slug,
      companyName: lead?.companyName ?? slug,
    };
  }

  if (clientSiteExists(slug)) {
    await markGenerationLock(slug, "generated");
    return {
      outcome: "skipped",
      reason: "a site already exists for this lead",
      slug,
      companyName: readLead(slug)?.companyName ?? slug,
    };
  }

  try {
    const result = await createClientFromLead(slug);
    if (result.outcome === "created") {
      await markGenerationLock(slug, "generated");
    } else {
      await releaseGenerationLock(slug);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markGenerationLock(slug, "failed", message);
    throw error;
  }
}

/**
 * Automated demo generation + git publish worker.
 * Requires DATABASE_URL. Reuses replenishSmsLeads / createClientFromLead.
 */
export async function runFactoryWorker(
  options: FactoryWorkerOptions = {},
): Promise<FactoryWorkerResult> {
  const config = getFactoryWorkerConfig();
  const triggerSource = options.triggerSource ?? "manual";
  const workerId =
    options.workerId ?? `worker-${hostname()}-${process.pid}`;

  const emptyMetrics = {
    demosGenerated: 0,
    demosPublished: 0,
    demosFailed: 0,
    actionableBefore: null as number | null,
    actionableAfter: null as number | null,
    needed: null as number | null,
  };

  if (!config.enabled && !options.force) {
    log("disabled via FACTORY_WORKER_ENABLED=false");
    return {
      status: "skipped",
      runId: null,
      skipped: true,
      skipReason: "FACTORY_WORKER_ENABLED=false",
      replenish: null,
      publish: null,
      metrics: emptyMetrics,
    };
  }

  const consecutiveFailures =
    options.force ? 0 : await countConsecutiveFailures();
  const minutesSinceFailure =
    options.force ? null : await minutesSinceLastFailure();
  const cooldown = shouldSkipForCooldown({
    consecutiveFailures,
    maxConsecutiveFailures: config.maxConsecutiveFailures,
    minutesSinceFailure,
    cooldownMinutes: config.cooldownMinutes,
    force: Boolean(options.force),
  });

  if (cooldown.skip) {
    log("skipped", { reason: cooldown.reason });
    return {
      status: "skipped",
      runId: null,
      skipped: true,
      skipReason: cooldown.reason,
      replenish: null,
      publish: null,
      metrics: emptyMetrics,
    };
  }

  const claimLease = options.claimLease ?? claimWorkerLease;
  const releaseLease = options.releaseLease ?? releaseWorkerLease;

  const lease = await claimLease({
    workerId,
    triggerSource,
  });

  if (!lease) {
    log("could not claim lease — another worker is active");
    return {
      status: "skipped",
      runId: null,
      skipped: true,
      skipReason: "Another factory worker holds an active lease",
      replenish: null,
      publish: null,
      metrics: emptyMetrics,
    };
  }

  const { runId } = lease;
  log("lease claimed", { runId, workerId, triggerSource });

  const staleReleased = await releaseStaleGeneratedLocksWithoutClient();
  if (staleReleased.length > 0) {
    log("released stale generated locks without client files", {
      count: staleReleased.length,
      sample: staleReleased.slice(0, 5),
    });
    await debugWorkerLog(
      "A",
      "src/factory/worker.ts:runFactoryWorker",
      "startup stale lock cleanup",
      { count: staleReleased.length, sample: staleReleased.slice(0, 8) },
    );
  }

  let replenish: ReplenishStats | null = null;
  let publish: PublishResult | null = null;
  let demosFailed = 0;

  try {
    await updateWorkerLeaseStatus(runId, "running");
    await updateWorkerRun(runId, { status: "generating" });

    const runReplenish = options.runReplenish ?? replenishSmsLeads;

    replenish = await runReplenish({
      readProgress: () => loadDiscoveryProgress(),
      writeProgress: (progress) => saveDiscoveryProgress(progress),
      createFromLead: (slug) => createFromLeadWithLock(slug, runId),
      onQueryComplete: (stats) => {
        log("query complete", {
          region: stats.region,
          profession: stats.profession,
          query: stats.query,
          newCandidates: stats.newCandidates,
        });
      },
    });

    demosFailed = replenish.errors.length;

    await updateWorkerRun(runId, {
      status: "generating",
      actionableBefore: replenish.actionableBefore,
      actionableAfter: replenish.actionableAfter,
      target: replenish.target,
      needed: replenish.needed,
      demosGenerated: replenish.demosGenerated,
      demosFailed,
      metrics: {
        candidatesDiscovered: replenish.candidatesDiscovered,
        queriesAttempted: replenish.queriesAttempted,
        queriesCompleted: replenish.queriesCompleted,
        runStopReason: replenish.runStopReason,
        errors: replenish.errors.slice(0, 20),
      },
    });

    log("replenish finished", {
      demosGenerated: replenish.demosGenerated,
      needed: replenish.needed,
      runStopReason: replenish.runStopReason,
      errorCount: replenish.errors.length,
    });

    if (replenish.demosGenerated <= 0 && replenish.toGenerate <= 0) {
      await updateWorkerRun(runId, {
        status: "skipped",
        demosGenerated: 0,
        demosPublished: 0,
        demosFailed,
        actionableBefore: replenish.actionableBefore,
        actionableAfter: replenish.actionableAfter,
        target: replenish.target,
        needed: replenish.needed,
        finished: true,
      });
      await releaseLease(runId);
      return {
        status: "skipped",
        runId,
        skipped: true,
        skipReason: "Backlog at or above target",
        replenish,
        publish: null,
        metrics: {
          demosGenerated: 0,
          demosPublished: 0,
          demosFailed,
          actionableBefore: replenish.actionableBefore,
          actionableAfter: replenish.actionableAfter,
          needed: replenish.needed,
        },
      };
    }

    if (replenish.demosGenerated <= 0) {
      // Searched but produced nothing — not a publish, not a hard failure unless errors.
      const status: WorkerRunStatus =
        replenish.errors.length > 0 ? "failed" : "skipped";
      await updateWorkerRun(runId, {
        status,
        demosGenerated: 0,
        demosPublished: 0,
        demosFailed,
        error:
          status === "failed"
            ? replenish.errors.slice(0, 5).join("; ")
            : "No demos generated this run",
        finished: true,
      });
      await releaseLease(runId);
      return {
        status,
        runId,
        skipped: status === "skipped",
        skipReason:
          status === "skipped" ? "No demos generated this run" : undefined,
        replenish,
        publish: null,
        metrics: {
          demosGenerated: 0,
          demosPublished: 0,
          demosFailed,
          actionableBefore: replenish.actionableBefore,
          actionableAfter: replenish.actionableAfter,
          needed: replenish.needed,
        },
        error: status === "failed" ? replenish.errors[0] : undefined,
      };
    }

    await updateWorkerLeaseStatus(runId, "publishing");
    await updateWorkerRun(runId, { status: "publishing" });

    const runPublish = options.runPublish ?? publishGeneratedDemos;
    publish = await runPublish();

    if (publish.outcome === "failed") {
      const locksReleased = await releaseGenerationLocksForRun(runId);
      log("publish failed — generation kept local; not marked published", {
        error: publish.error,
        locksReleased,
      });
      await debugWorkerLog(
        "C",
        "src/factory/worker.ts:runFactoryWorker",
        "publish failed; released run locks",
        { locksReleased, error: publish.error?.slice(0, 200) ?? null },
      );
      await updateWorkerRun(runId, {
        status: "failed",
        demosGenerated: replenish.demosGenerated,
        demosPublished: 0,
        demosFailed,
        error: `Publish failed: ${publish.error}`,
        finished: true,
      });
      await releaseLease(runId);
      return {
        status: "failed",
        runId,
        skipped: false,
        replenish,
        publish,
        metrics: {
          demosGenerated: replenish.demosGenerated,
          demosPublished: 0,
          demosFailed,
          actionableBefore: replenish.actionableBefore,
          actionableAfter: replenish.actionableAfter,
          needed: replenish.needed,
        },
        error: publish.error,
      };
    }

    const demosPublished =
      publish.outcome === "published" ? publish.slugs.length : 0;

    if (publish.outcome === "published") {
      await markGeneratedSlugsPublished(publish.slugs);
    }

    await updateWorkerRun(runId, {
      status: publish.outcome === "published" ? "published" : "skipped",
      demosGenerated: replenish.demosGenerated,
      demosPublished,
      demosFailed,
      publishCommitSha:
        publish.outcome === "published" ? publish.commitSha : null,
      actionableBefore: replenish.actionableBefore,
      actionableAfter: replenish.actionableAfter,
      target: replenish.target,
      needed: replenish.needed,
      metrics: {
        publishOutcome: publish.outcome,
        publishSlugs: publish.slugs,
        runStopReason: replenish.runStopReason,
      },
      finished: true,
    });

    await releaseLease(runId);

    log("run complete", {
      status: publish.outcome === "published" ? "published" : publish.outcome,
      demosGenerated: replenish.demosGenerated,
      demosPublished,
    });

    return {
      status: publish.outcome === "published" ? "published" : "skipped",
      runId,
      skipped: publish.outcome !== "published",
      skipReason:
        publish.outcome === "noop" ? publish.reason : undefined,
      replenish,
      publish,
      metrics: {
        demosGenerated: replenish.demosGenerated,
        demosPublished,
        demosFailed,
        actionableBefore: replenish.actionableBefore,
        actionableAfter: replenish.actionableAfter,
        needed: replenish.needed,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("fatal error", { error: message });
    try {
      await updateWorkerRun(runId, {
        status: "failed",
        demosGenerated: replenish?.demosGenerated ?? 0,
        demosPublished: 0,
        demosFailed: demosFailed + 1,
        error: message,
        finished: true,
      });
    } catch {
      // ignore secondary failures
    }
    try {
      await releaseLease(runId);
    } catch {
      // lease will expire
    }
    return {
      status: "failed",
      runId,
      skipped: false,
      replenish,
      publish,
      metrics: {
        demosGenerated: replenish?.demosGenerated ?? 0,
        demosPublished: 0,
        demosFailed: demosFailed + 1,
        actionableBefore: replenish?.actionableBefore ?? null,
        actionableAfter: replenish?.actionableAfter ?? null,
        needed: replenish?.needed ?? null,
      },
      error: message,
    };
  }
}
