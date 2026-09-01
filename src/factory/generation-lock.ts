import { isDatabaseConfigured, sql } from "@/db/client";
import { upsertDemoLifecycleGenerated } from "@/demo-lifecycle/store";
import { ensureFactorySchema } from "@/db/ensure-schema";
import { markDemoLifecyclePublished } from "@/demo-lifecycle/store";
import { clientSiteExists } from "@/leads/client-exists";
import { getFactoryWorkerConfig } from "./config";

export type GenerationLockStatus =
  | "generating"
  | "generated"
  | "published"
  | "failed";

type LockRow = {
  slug: string;
  run_id: string;
  status: string;
  error: string | null;
  updated_at: Date | string;
};

async function requireDb() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for generation locks");
  }
  await ensureFactorySchema();
  return sql();
}

/**
 * Try to acquire an exclusive generation lock for a slug.
 * Returns false if another run holds a fresh generating/generated lock,
 * or a failed lock still inside the retry cooldown.
 */
export async function tryAcquireGenerationLock(
  slug: string,
  runId: string,
  options?: { retryMinutes?: number },
): Promise<boolean> {
  const db = await requireDb();
  const retryMinutes =
    options?.retryMinutes ?? getFactoryWorkerConfig().generationRetryMinutes;

  const existing = (await db`
    SELECT slug, run_id, status, error, updated_at
    FROM factory_generation_locks
    WHERE slug = ${slug}
    LIMIT 1
  `) as LockRow[];

  const row = existing[0];
  if (row) {
    if (row.status === "generating" || row.status === "generated") {
      if (row.run_id === runId) {
        return true;
      }
      return false;
    }

    if (row.status === "published") {
      return false;
    }

    if (row.status === "failed") {
      const ageMs = Date.now() - new Date(row.updated_at).getTime();
      if (ageMs < retryMinutes * 60_000 && row.run_id !== runId) {
        return false;
      }
    }
  }

  await db`
    INSERT INTO factory_generation_locks (slug, run_id, status, updated_at)
    VALUES (${slug}, ${runId}, 'generating', NOW())
    ON CONFLICT (slug) DO UPDATE SET
      run_id = EXCLUDED.run_id,
      status = 'generating',
      error = NULL,
      updated_at = NOW()
  `;

  const verify = (await db`
    SELECT run_id FROM factory_generation_locks
    WHERE slug = ${slug} AND run_id = ${runId} AND status = 'generating'
    LIMIT 1
  `) as Array<{ run_id: string }>;

  const acquired = Boolean(verify[0]);
  if (acquired) {
    await upsertDemoLifecycleGenerated(slug);
  }

  return acquired;
}

export async function markGenerationLock(
  slug: string,
  status: GenerationLockStatus,
  error?: string,
): Promise<void> {
  const db = await requireDb();
  await db`
    UPDATE factory_generation_locks
    SET
      status = ${status},
      error = ${error ?? null},
      updated_at = NOW()
    WHERE slug = ${slug}
  `;
}

export async function releaseGenerationLock(slug: string): Promise<void> {
  const db = await requireDb();
  await db`
    DELETE FROM factory_generation_locks
    WHERE slug = ${slug}
  `;
}

/**
 * Drop generated/generating locks for a worker run after publish failed so the
 * next attempt can regenerate and push (GHA disk is ephemeral).
 */
export async function releaseGenerationLocksForRun(runId: string): Promise<number> {
  const db = await requireDb();
  const rows = (await db`
    DELETE FROM factory_generation_locks
    WHERE run_id = ${runId}
      AND status IN ('generating', 'generated')
    RETURNING slug
  `) as Array<{ slug: string }>;
  return rows.length;
}

/**
 * Clear generated locks that never reached git (failed publish on ephemeral runner).
 */
export async function releaseStaleGeneratedLocksWithoutClient(): Promise<string[]> {
  const db = await requireDb();
  const rows = (await db`
    SELECT slug FROM factory_generation_locks
    WHERE status = 'generated'
  `) as Array<{ slug: string }>;

  const released: string[] = [];
  for (const row of rows) {
    if (clientSiteExists(row.slug)) {
      continue;
    }
    await releaseGenerationLock(row.slug);
    released.push(row.slug);
  }
  return released;
}

/**
 * If a slug is marked generated in Neon but has no client JSON on disk, drop the lock.
 */
export async function releaseStaleGeneratedLockIfNoClient(
  slug: string,
): Promise<boolean> {
  if (clientSiteExists(slug)) {
    return false;
  }
  const db = await requireDb();
  const rows = (await db`
    SELECT status FROM factory_generation_locks
    WHERE slug = ${slug}
    LIMIT 1
  `) as Array<{ status: string }>;
  const status = rows[0]?.status;
  if (status !== "generated" && status !== "generating") {
    return false;
  }
  await releaseGenerationLock(slug);
  return true;
}

export async function markGeneratedSlugsPublished(
  slugs: string[],
): Promise<void> {
  if (slugs.length === 0) {
    return;
  }
  const db = await requireDb();
  for (const slug of slugs) {
    await db`
      UPDATE factory_generation_locks
      SET status = 'published', updated_at = NOW()
      WHERE slug = ${slug} AND status = 'generated'
    `;
  }

  await markDemoLifecyclePublished(slugs, new Date());
}

/**
 * Whether a failed lock should surface as a factory health issue.
 * Expired cooldown rows are retryable; client-on-disk rows are stale.
 */
export function isFailedGenerationLockActionable(input: {
  updatedAtMs: number;
  nowMs: number;
  retryMinutes: number;
  clientExists: boolean;
}): boolean {
  if (input.clientExists) {
    return false;
  }

  const ageMs = input.nowMs - input.updatedAtMs;
  return ageMs < input.retryMinutes * 60_000;
}

export async function countActionableFailedGenerationLocks(
  retryMinutes?: number,
): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }

  const retry =
    retryMinutes ?? getFactoryWorkerConfig().generationRetryMinutes;
  const db = await requireDb();
  const rows = (await db`
    SELECT slug, updated_at
    FROM factory_generation_locks
    WHERE status = 'failed'
  `) as Array<{ slug: string; updated_at: Date | string }>;

  const nowMs = Date.now();
  return rows.filter((row) =>
    isFailedGenerationLockActionable({
      updatedAtMs: new Date(row.updated_at).getTime(),
      nowMs,
      retryMinutes: retry,
      clientExists: clientSiteExists(row.slug),
    }),
  ).length;
}

/**
 * Remove failed locks that no longer block retries (cooldown elapsed or client exists).
 */
export async function releaseStaleFailedGenerationLocks(
  retryMinutes?: number,
): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const retry =
    retryMinutes ?? getFactoryWorkerConfig().generationRetryMinutes;
  const db = await requireDb();
  const rows = (await db`
    SELECT slug, updated_at
    FROM factory_generation_locks
    WHERE status = 'failed'
  `) as Array<{ slug: string; updated_at: Date | string }>;

  const nowMs = Date.now();
  const released: string[] = [];

  for (const row of rows) {
    const actionable = isFailedGenerationLockActionable({
      updatedAtMs: new Date(row.updated_at).getTime(),
      nowMs,
      retryMinutes: retry,
      clientExists: clientSiteExists(row.slug),
    });

    if (!actionable) {
      await releaseGenerationLock(row.slug);
      released.push(row.slug);
    }
  }

  return released;
}

/**
 * Pure decision helper for tests — whether an existing lock blocks a new claim.
 */
export function isGenerationLockBlocking(input: {
  existing: {
    status: GenerationLockStatus;
    runId: string;
    updatedAtMs: number;
  } | null;
  claimRunId: string;
  nowMs: number;
  retryMinutes: number;
  clientExists?: boolean;
}): boolean {
  if (!input.existing) {
    return false;
  }
  if (
    input.existing.status === "generating"
    || input.existing.status === "generated"
  ) {
    if (input.existing.runId === input.claimRunId) {
      return false;
    }
    if (
      input.existing.status === "generated"
      && input.clientExists === false
    ) {
      return false;
    }
    return true;
  }
  if (input.existing.status === "published") {
    return true;
  }
  if (input.existing.status === "failed") {
    const ageMs = input.nowMs - input.existing.updatedAtMs;
    return ageMs < input.retryMinutes * 60_000
      && input.existing.runId !== input.claimRunId;
  }
  return false;
}
