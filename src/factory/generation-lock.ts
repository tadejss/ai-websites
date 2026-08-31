import { isDatabaseConfigured, sql } from "@/db/client";
import { upsertDemoLifecycleGenerated } from "@/demo-lifecycle/store";
import { ensureFactorySchema } from "@/db/ensure-schema";
import { markDemoLifecyclePublished } from "@/demo-lifecycle/store";
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
}): boolean {
  if (!input.existing) {
    return false;
  }
  if (
    input.existing.status === "generating"
    || input.existing.status === "generated"
  ) {
    return input.existing.runId !== input.claimRunId;
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
