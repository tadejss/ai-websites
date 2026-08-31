import { randomUUID } from "node:crypto";
import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureFactorySchema } from "@/db/ensure-schema";
import { getFactoryWorkerConfig } from "./config";

const LEASE_ID = "default";

export type WorkerLease = {
  runId: string;
  workerId: string;
  expiresAt: string;
};

export type WorkerRunStatus =
  | "claimed"
  | "generating"
  | "publishing"
  | "published"
  | "skipped"
  | "failed";

export type WorkerRunRecord = {
  runId: string;
  workerId: string;
  triggerSource: string;
  status: WorkerRunStatus;
  actionableBefore: number | null;
  actionableAfter: number | null;
  target: number | null;
  needed: number | null;
  demosGenerated: number;
  demosPublished: number;
  demosFailed: number;
  publishCommitSha: string | null;
  error: string | null;
  metrics: Record<string, unknown> | null;
  startedAt: string;
  finishedAt: string | null;
};

type LeaseRow = {
  run_id: string;
  worker_id: string;
  status: string;
  expires_at: Date | string;
};

type RunRow = {
  run_id: string;
  worker_id: string;
  trigger_source: string;
  status: string;
  actionable_before: number | null;
  actionable_after: number | null;
  target: number | null;
  needed: number | null;
  demos_generated: number;
  demos_published: number;
  demos_failed: number;
  publish_commit_sha: string | null;
  error: string | null;
  metrics: Record<string, unknown> | null;
  started_at: Date | string;
  finished_at: Date | string | null;
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapRun(row: RunRow): WorkerRunRecord {
  return {
    runId: row.run_id,
    workerId: row.worker_id,
    triggerSource: row.trigger_source,
    status: row.status as WorkerRunStatus,
    actionableBefore: row.actionable_before,
    actionableAfter: row.actionable_after,
    target: row.target,
    needed: row.needed,
    demosGenerated: row.demos_generated,
    demosPublished: row.demos_published,
    demosFailed: row.demos_failed,
    publishCommitSha: row.publish_commit_sha,
    error: row.error,
    metrics: row.metrics,
    startedAt: toIso(row.started_at),
    finishedAt: row.finished_at ? toIso(row.finished_at) : null,
  };
}

async function requireDb() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for the factory worker");
  }
  await ensureFactorySchema();
  return sql();
}

/**
 * Acquire a singleton worker lease. Returns null if another run holds a
 * non-expired lease (safe concurrency across GitHub Actions / local workers).
 */
export async function claimWorkerLease(input: {
  workerId: string;
  triggerSource: string;
  leaseMinutes?: number;
}): Promise<WorkerLease | null> {
  const db = await requireDb();
  const config = getFactoryWorkerConfig();
  const leaseMinutes = input.leaseMinutes ?? config.leaseMinutes;
  const runId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + leaseMinutes * 60_000);

  const existing = (await db`
    SELECT run_id, worker_id, status, expires_at
    FROM factory_worker_lease
    WHERE id = ${LEASE_ID}
    LIMIT 1
  `) as LeaseRow[];

  const current = existing[0];
  if (current) {
    const expires = new Date(current.expires_at).getTime();
    if (expires > Date.now()) {
      return null;
    }
  }

  if (current) {
    await db`
      UPDATE factory_worker_lease
      SET
        run_id = ${runId},
        worker_id = ${input.workerId},
        status = 'claimed',
        claimed_at = NOW(),
        expires_at = ${expiresAt.toISOString()},
        updated_at = NOW()
      WHERE id = ${LEASE_ID}
        AND expires_at <= NOW()
    `;

    const verify = (await db`
      SELECT run_id FROM factory_worker_lease
      WHERE id = ${LEASE_ID} AND run_id = ${runId}
      LIMIT 1
    `) as Array<{ run_id: string }>;

    if (!verify[0]) {
      return null;
    }
  } else {
    try {
      await db`
        INSERT INTO factory_worker_lease (
          id, run_id, worker_id, status, claimed_at, expires_at, updated_at
        ) VALUES (
          ${LEASE_ID},
          ${runId},
          ${input.workerId},
          'claimed',
          NOW(),
          ${expiresAt.toISOString()},
          NOW()
        )
      `;
    } catch {
      return null;
    }
  }

  await db`
    INSERT INTO factory_worker_runs (
      run_id, worker_id, trigger_source, status, started_at
    ) VALUES (
      ${runId},
      ${input.workerId},
      ${input.triggerSource},
      'claimed',
      NOW()
    )
  `;

  return {
    runId,
    workerId: input.workerId,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function updateWorkerLeaseStatus(
  runId: string,
  status: string,
): Promise<void> {
  const db = await requireDb();
  await db`
    UPDATE factory_worker_lease
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${LEASE_ID} AND run_id = ${runId}
  `;
}

export async function releaseWorkerLease(runId: string): Promise<void> {
  const db = await requireDb();
  await db`
    DELETE FROM factory_worker_lease
    WHERE id = ${LEASE_ID} AND run_id = ${runId}
  `;
}

export async function updateWorkerRun(
  runId: string,
  patch: {
    status: WorkerRunStatus;
    actionableBefore?: number | null;
    actionableAfter?: number | null;
    target?: number | null;
    needed?: number | null;
    demosGenerated?: number;
    demosPublished?: number;
    demosFailed?: number;
    publishCommitSha?: string | null;
    error?: string | null;
    metrics?: Record<string, unknown> | null;
    finished?: boolean;
  },
): Promise<void> {
  const db = await requireDb();
  const finishedAt = patch.finished ? new Date().toISOString() : null;

  // Read-modify-write so partial patches do not wipe unset fields.
  const rows = (await db`
    SELECT * FROM factory_worker_runs WHERE run_id = ${runId} LIMIT 1
  `) as RunRow[];
  const current = rows[0];
  if (!current) {
    return;
  }

  const next = {
    status: patch.status,
    actionable_before:
      patch.actionableBefore !== undefined
        ? patch.actionableBefore
        : current.actionable_before,
    actionable_after:
      patch.actionableAfter !== undefined
        ? patch.actionableAfter
        : current.actionable_after,
    target: patch.target !== undefined ? patch.target : current.target,
    needed: patch.needed !== undefined ? patch.needed : current.needed,
    demos_generated:
      patch.demosGenerated !== undefined
        ? patch.demosGenerated
        : current.demos_generated,
    demos_published:
      patch.demosPublished !== undefined
        ? patch.demosPublished
        : current.demos_published,
    demos_failed:
      patch.demosFailed !== undefined
        ? patch.demosFailed
        : current.demos_failed,
    publish_commit_sha:
      patch.publishCommitSha !== undefined
        ? patch.publishCommitSha
        : current.publish_commit_sha,
    error: patch.error !== undefined ? patch.error : current.error,
    metrics:
      patch.metrics !== undefined ? patch.metrics : current.metrics,
    finished_at: finishedAt ?? current.finished_at,
  };

  await db`
    UPDATE factory_worker_runs
    SET
      status = ${next.status},
      actionable_before = ${next.actionable_before},
      actionable_after = ${next.actionable_after},
      target = ${next.target},
      needed = ${next.needed},
      demos_generated = ${next.demos_generated},
      demos_published = ${next.demos_published},
      demos_failed = ${next.demos_failed},
      publish_commit_sha = ${next.publish_commit_sha},
      error = ${next.error},
      metrics = ${next.metrics as never},
      finished_at = ${next.finished_at}
    WHERE run_id = ${runId}
  `;
}

export async function getRecentWorkerRuns(
  limit = 10,
): Promise<WorkerRunRecord[]> {
  const db = await requireDb();
  const rows = (await db`
    SELECT *
    FROM factory_worker_runs
    ORDER BY started_at DESC
    LIMIT ${limit}
  `) as RunRow[];
  return rows.map(mapRun);
}

export type ActiveWorkerLease = {
  runId: string;
  workerId: string;
  status: string;
  expiresAt: string;
  isExpired: boolean;
};

export async function getActiveWorkerLease(): Promise<ActiveWorkerLease | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }
  await ensureFactorySchema();
  const db = sql();
  const rows = (await db`
    SELECT run_id, worker_id, status, expires_at
    FROM factory_worker_lease
    WHERE id = ${LEASE_ID}
    LIMIT 1
  `) as Array<{
    run_id: string;
    worker_id: string;
    status: string;
    expires_at: Date | string;
  }>;

  const row = rows[0];
  if (!row) {
    return null;
  }

  const expiresAt = toIso(row.expires_at);
  return {
    runId: row.run_id,
    workerId: row.worker_id,
    status: row.status,
    expiresAt,
    isExpired: new Date(expiresAt).getTime() <= Date.now(),
  };
}

export async function getLastSuccessfulWorkerRun(): Promise<WorkerRunRecord | null> {
  const runs = await getRecentWorkerRuns(20);
  for (const run of runs) {
    if (run.status === "published") {
      return run;
    }
  }
  return null;
}

export async function getLatestWorkerRunWithError(): Promise<WorkerRunRecord | null> {
  const runs = await getRecentWorkerRuns(20);
  return runs.find((run) => run.error?.trim()) ?? null;
}

export async function getGenerationLockCounts(): Promise<Record<string, number>> {
  if (!isDatabaseConfigured()) {
    return {};
  }
  await ensureFactorySchema();
  const db = sql();
  const rows = (await db`
    SELECT status, COUNT(*)::int AS count
    FROM factory_generation_locks
    GROUP BY status
  `) as Array<{ status: string; count: number }>;

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.status] = row.count;
  }
  return result;
}

export async function countStaleGeneratingLocks(
  staleMinutes: number,
): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }
  await ensureFactorySchema();
  const db = sql();
  const rows = (await db`
    SELECT COUNT(*)::int AS count
    FROM factory_generation_locks
    WHERE status = 'generating'
      AND updated_at < NOW() - (${staleMinutes}::text || ' minutes')::interval
  `) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

export async function countConsecutiveFailures(): Promise<number> {
  const runs = await getRecentWorkerRuns(20);
  let count = 0;
  for (const run of runs) {
    if (run.status === "skipped") {
      continue;
    }
    if (run.status === "failed") {
      count += 1;
      continue;
    }
    break;
  }
  return count;
}

export async function minutesSinceLastFailure(): Promise<number | null> {
  const runs = await getRecentWorkerRuns(20);
  const lastFailure = runs.find((run) => run.status === "failed");
  if (!lastFailure?.finishedAt && !lastFailure?.startedAt) {
    return null;
  }
  const stamp = lastFailure.finishedAt ?? lastFailure.startedAt;
  return (Date.now() - new Date(stamp).getTime()) / 60_000;
}

/**
 * Pure helpers exported for unit tests (no DB).
 */
export function shouldSkipForCooldown(input: {
  consecutiveFailures: number;
  maxConsecutiveFailures: number;
  minutesSinceFailure: number | null;
  cooldownMinutes: number;
  force: boolean;
}): { skip: boolean; reason?: string } {
  if (input.force) {
    return { skip: false };
  }

  if (
    input.consecutiveFailures >= input.maxConsecutiveFailures
    && input.minutesSinceFailure !== null
    && input.minutesSinceFailure < input.cooldownMinutes * 2
  ) {
    return {
      skip: true,
      reason: `Circuit open: ${input.consecutiveFailures} consecutive failures (max ${input.maxConsecutiveFailures}). Wait or pass --force.`,
    };
  }

  if (
    input.minutesSinceFailure !== null
    && input.minutesSinceFailure < input.cooldownMinutes
    && input.consecutiveFailures > 0
  ) {
    return {
      skip: true,
      reason: `Cooldown active: last failure ${input.minutesSinceFailure.toFixed(1)}m ago (need ${input.cooldownMinutes}m).`,
    };
  }

  return { skip: false };
}
