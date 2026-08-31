import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureFactorySchema } from "@/db/ensure-schema";
import {
  createInitialProgress,
  readDiscoveryProgress,
  writeDiscoveryProgress,
  type DiscoveryProgress,
} from "@/leads/discovery-progress";

const PROGRESS_ID = "default";

function isValidProgress(value: unknown): value is DiscoveryProgress {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as DiscoveryProgress;
  return candidate.version === 1 && Boolean(candidate.combinations);
}

/**
 * Load discovery matrix progress from Neon when DATABASE_URL is set,
 * otherwise from the local gitignored file (manual CLI fallback).
 */
export async function loadDiscoveryProgress(): Promise<DiscoveryProgress> {
  if (!isDatabaseConfigured()) {
    return readDiscoveryProgress();
  }

  await ensureFactorySchema();
  const db = sql();
  const rows = (await db`
    SELECT progress
    FROM factory_discovery_progress
    WHERE id = ${PROGRESS_ID}
    LIMIT 1
  `) as Array<{ progress: unknown }>;

  const stored = rows[0]?.progress;
  if (isValidProgress(stored)) {
    return stored;
  }

  // Seed from local file if present (one-time migration for operators).
  const fromFile = readDiscoveryProgress();
  await saveDiscoveryProgress(fromFile);
  return fromFile;
}

export async function saveDiscoveryProgress(
  progress: DiscoveryProgress,
): Promise<void> {
  const payload: DiscoveryProgress = {
    ...progress,
    updatedAt: new Date().toISOString(),
  };

  if (!isDatabaseConfigured()) {
    writeDiscoveryProgress(payload);
    return;
  }

  await ensureFactorySchema();
  const db = sql();
  await db`
    INSERT INTO factory_discovery_progress (id, progress, updated_at)
    VALUES (${PROGRESS_ID}, ${payload as never}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      progress = EXCLUDED.progress,
      updated_at = NOW()
  `;

  // Keep local file in sync when running outside CI for operator visibility.
  try {
    writeDiscoveryProgress(payload);
  } catch {
    // Local write is best-effort (e.g. read-only CI after Neon save).
  }
}

export async function getDiscoveryProgressUpdatedAt(): Promise<string | null> {
  if (!isDatabaseConfigured()) {
    const progress = readDiscoveryProgress();
    return progress.updatedAt ?? null;
  }

  await ensureFactorySchema();
  const db = sql();
  const rows = (await db`
    SELECT updated_at
    FROM factory_discovery_progress
    WHERE id = ${PROGRESS_ID}
    LIMIT 1
  `) as Array<{ updated_at: Date | string | null }>;

  const value = rows[0]?.updated_at;
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function resetDiscoveryProgressStore(): Promise<void> {
  const initial = createInitialProgress();

  if (isDatabaseConfigured()) {
    await ensureFactorySchema();
    const db = sql();
    await db`
      INSERT INTO factory_discovery_progress (id, progress, updated_at)
      VALUES (${PROGRESS_ID}, ${initial as never}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        progress = EXCLUDED.progress,
        updated_at = NOW()
    `;
  }

  writeDiscoveryProgress(initial);
}
