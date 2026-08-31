import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import { getFactoryWorkerConfig } from "@/factory/config";

export type PublishFailedRow = {
  slug: string;
  publishError: string | null;
  updatedAt: string;
};

export type CustomerPublishOpsAggregates = {
  byStatus: Record<string, number>;
  publishFailed: number;
  publishing: number;
  stuckPublishing: number;
  activeLeases: number;
  waitingOnboarding: number;
  waitingApproval: number;
  queuedForPublish: number;
  lastSuccessfulPublishAt: string | null;
  publishFailedRows: PublishFailedRow[];
};

export type ActiveCustomerPublishLease = {
  slug: string;
  runId: string;
  workerId: string;
  status: string;
  expiresAt: string;
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function sumStatuses(
  byStatus: Record<string, number>,
  statuses: string[],
): number {
  return statuses.reduce((sum, status) => sum + (byStatus[status] ?? 0), 0);
}

export async function getCustomerPublishOpsAggregates(): Promise<CustomerPublishOpsAggregates> {
  if (!isDatabaseConfigured()) {
    return {
      byStatus: {},
      publishFailed: 0,
      publishing: 0,
      stuckPublishing: 0,
      activeLeases: 0,
      waitingOnboarding: 0,
      waitingApproval: 0,
      queuedForPublish: 0,
      lastSuccessfulPublishAt: null,
      publishFailedRows: [],
    };
  }

  await ensureCustomerSchema();
  const db = sql();
  const config = getFactoryWorkerConfig();
  const stuckMinutes = config.leaseMinutes * 2;

  const statusRows = (await db`
    SELECT status, COUNT(*)::int AS count
    FROM customer_onboarding
    GROUP BY status
  `) as Array<{ status: string; count: number }>;

  const stuckRows = (await db`
    SELECT COUNT(*)::int AS count
    FROM customer_onboarding
    WHERE status = 'publishing'
      AND COALESCE(publish_started_at, updated_at) < NOW() - (${stuckMinutes}::text || ' minutes')::interval
  `) as Array<{ count: number }>;

  const leaseRows = (await db`
    SELECT COUNT(*)::int AS count
    FROM customer_publish_lease
    WHERE expires_at > NOW()
  `) as Array<{ count: number }>;

  const lastLiveRows = (await db`
    SELECT MAX(published_at) AS published_at
    FROM customer_onboarding
    WHERE status = 'live'
  `) as Array<{ published_at: Date | string | null }>;

  const failedRows = (await db`
    SELECT slug, publish_error, updated_at
    FROM customer_onboarding
    WHERE status = 'publish_failed'
    ORDER BY updated_at DESC
    LIMIT 5
  `) as Array<{
    slug: string;
    publish_error: string | null;
    updated_at: Date | string;
  }>;

  const byStatus: Record<string, number> = {};
  for (const row of statusRows) {
    byStatus[row.status] = row.count;
  }

  const lastPublished = lastLiveRows[0]?.published_at;

  return {
    byStatus,
    publishFailed: byStatus.publish_failed ?? 0,
    publishing: byStatus.publishing ?? 0,
    stuckPublishing: stuckRows[0]?.count ?? 0,
    activeLeases: leaseRows[0]?.count ?? 0,
    waitingOnboarding: sumStatuses(byStatus, ["pending", "in_progress"]),
    waitingApproval: sumStatuses(byStatus, [
      "submitted",
      "processing",
      "ready_for_approval",
    ]),
    queuedForPublish: byStatus.approved_for_publish ?? 0,
    lastSuccessfulPublishAt: lastPublished ? toIso(lastPublished) : null,
    publishFailedRows: failedRows.map((row) => ({
      slug: row.slug,
      publishError: row.publish_error,
      updatedAt: toIso(row.updated_at),
    })),
  };
}

export async function listActiveCustomerPublishLeases(
  limit = 10,
): Promise<ActiveCustomerPublishLease[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT slug, run_id, worker_id, status, expires_at
    FROM customer_publish_lease
    WHERE expires_at > NOW()
    ORDER BY claimed_at DESC
    LIMIT ${limit}
  `) as Array<{
    slug: string;
    run_id: string;
    worker_id: string;
    status: string;
    expires_at: Date | string;
  }>;

  return rows.map((row) => ({
    slug: row.slug,
    runId: row.run_id,
    workerId: row.worker_id,
    status: row.status,
    expiresAt:
      row.expires_at instanceof Date
        ? row.expires_at.toISOString()
        : new Date(row.expires_at).toISOString(),
  }));
}
