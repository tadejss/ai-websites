import { unstable_cache } from "next/cache";
import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import type { HealthPayload } from "@/components/admin/admin-health-strip";
import { getFactoryWorkerConfig } from "@/factory/config";
import { countActionableFailedGenerationLocks } from "@/factory/generation-lock";
import {
  countConsecutiveFailures,
  countStaleGeneratingLocks,
  getActiveWorkerLease,
  getGenerationLockCounts,
  getRecentWorkerRuns,
  minutesSinceLastFailure,
  shouldSkipForCooldown,
} from "@/factory/lease";
import {
  evaluateFactoryOpsHealth,
  type FactoryOpsHealth,
} from "@/factory/ops-health";
import {
  getFactoryOpsSnapshot,
  type FactoryOpsSnapshot,
} from "@/factory/ops-snapshot";
import { getSmsConfig, isSmsGatewayConfigured } from "@/outreach/sms/config";
import { countSentToday } from "@/outreach/sms/store";
import { countQaRunsByStatus } from "@/qa/store";

export const ADMIN_HEALTH_CACHE_TAG = "admin-health-summary";
const HEALTH_SUMMARY_REVALIDATE_SECONDS = 15;

function isDispatchReady(
  config: ReturnType<typeof getFactoryWorkerConfig>,
): boolean {
  return Boolean(config.githubRepo && config.githubToken);
}

function workerLevel(input: {
  databaseConfigured: boolean;
  circuitOpen: boolean;
  activeLease: { isExpired: boolean; workerId: string } | null;
  healthLevel: FactoryOpsHealth["level"];
}): HealthPayload["factory"] {
  if (!input.databaseConfigured) {
    return { level: "idle", detail: "no DB" };
  }
  if (input.circuitOpen) {
    return { level: "failed", detail: "circuit open" };
  }
  if (input.activeLease && !input.activeLease.isExpired) {
    return {
      level: "ok",
      detail: `lease ${input.activeLease.workerId.slice(0, 8)}`,
    };
  }
  if (input.healthLevel === "failed") {
    return { level: "failed", detail: "issues" };
  }
  if (input.healthLevel === "warning") {
    return { level: "warning", detail: "check factory" };
  }
  return { level: "ok", detail: "idle" };
}

function buildHealthPayload(input: {
  databaseConfigured: boolean;
  circuitOpen: boolean;
  activeLease: { isExpired: boolean; workerId: string } | null;
  healthLevel: FactoryOpsHealth["level"];
  sentToday: number;
  dailyLimit: number;
  gatewayConfigured: boolean;
  dispatchEnabled: boolean;
  dispatchReady: boolean;
  publishEnabled: boolean;
}): HealthPayload {
  const smsLevel: HealthPayload["sms"]["level"] =
    input.sentToday >= input.dailyLimit ? "warning" : "ok";

  const gatewayLevel: HealthPayload["gateway"]["level"] = input.gatewayConfigured
    ? "ok"
    : "failed";

  let dispatchLevel: HealthPayload["dispatch"]["level"] = "ok";
  let dispatchDetail = "ready";
  if (!input.dispatchEnabled) {
    dispatchLevel = "warning";
    dispatchDetail = "dispatch off";
  } else if (!input.dispatchReady) {
    dispatchLevel = "failed";
    dispatchDetail = "missing GH creds";
  } else if (!input.publishEnabled) {
    dispatchLevel = "warning";
    dispatchDetail = "publish off";
  }

  return {
    factory: workerLevel(input),
    sms: {
      level: smsLevel,
      detail: `${input.sentToday}/${input.dailyLimit}`,
    },
    gateway: {
      level: gatewayLevel,
      detail: input.gatewayConfigured ? "online" : "offline",
    },
    dispatch: { level: dispatchLevel, detail: dispatchDetail },
  };
}

export function healthPayloadFromSnapshot(
  snapshot: FactoryOpsSnapshot,
): HealthPayload {
  return buildHealthPayload({
    databaseConfigured: snapshot.databaseConfigured,
    circuitOpen: snapshot.worker.circuitOpen,
    activeLease: snapshot.worker.activeLease
      ? {
          isExpired: snapshot.worker.activeLease.isExpired,
          workerId: snapshot.worker.activeLease.workerId,
        }
      : null,
    healthLevel: snapshot.health.level,
    sentToday: snapshot.sms.sentToday,
    dailyLimit: snapshot.sms.dailyLimit,
    gatewayConfigured: snapshot.sms.gatewayConfigured,
    dispatchEnabled: snapshot.config.dispatchEnabled,
    dispatchReady: snapshot.config.dispatchReady,
    publishEnabled: snapshot.config.publishEnabled,
  });
}

/** @deprecated Prefer getAdminHealthSummary — full snapshot is for Factory page. */
export async function getAdminHealthPayload(): Promise<HealthPayload> {
  return healthPayloadFromSnapshot(await getFactoryOpsSnapshot());
}

async function countPublishFailed(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT COUNT(*)::int AS count
    FROM customer_onboarding
    WHERE status = 'publish_failed'
  `) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

async function countStuckPublishing(stuckMinutes: number): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT COUNT(*)::int AS count
    FROM customer_onboarding
    WHERE status = 'publishing'
      AND COALESCE(publish_started_at, updated_at) < NOW() - (${stuckMinutes}::text || ' minutes')::interval
  `) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

async function countPublishing(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT COUNT(*)::int AS count
    FROM customer_onboarding
    WHERE status = 'publishing'
  `) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

async function countActivePublishLeases(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT COUNT(*)::int AS count
    FROM customer_publish_lease
    WHERE expires_at > NOW()
  `) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

async function countQueuedForPublish(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT COUNT(*)::int AS count
    FROM customer_onboarding
    WHERE status = 'approved_for_publish'
  `) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

export type AdminHealthSummary = HealthPayload & {
  circuitOpen: boolean;
};

async function loadAdminHealthSummary(): Promise<AdminHealthSummary> {
  const databaseConfigured = isDatabaseConfigured();
  const config = getFactoryWorkerConfig();
  const smsConfig = getSmsConfig();
  const dispatchReady = isDispatchReady(config);
  const gatewayConfigured = isSmsGatewayConfigured();

  if (!databaseConfigured) {
    const health = evaluateFactoryOpsHealth({
      databaseConfigured: false,
      factoryEnabled: config.enabled,
      dispatchEnabled: config.dispatchEnabled,
      publishEnabled: config.publishEnabled,
      dispatchReady,
      replenish: { actionable: 0, target: 0, needed: 0 },
      worker: {
        consecutiveFailures: 0,
        maxConsecutiveFailures: config.maxConsecutiveFailures,
        minutesSinceFailure: null,
        cooldownMinutes: config.cooldownMinutes,
        circuitOpen: false,
        cooldownActive: false,
        lastRunStatus: null,
        lastRunError: null,
        activeLease: null,
      },
      generationLocks: { generating: 0, failed: 0, staleGenerating: 0 },
      customerPublish: {
        publishing: 0,
        publishFailed: 0,
        stuckPublishing: 0,
        activeLeases: 0,
        queuedForPublish: 0,
      },
      grokQa: { failed: 0 },
      sms: {
        gatewayConfigured,
        queueStaleHours: null,
        queueStaleThresholdHours: 2,
      },
    });

    return {
      ...buildHealthPayload({
        databaseConfigured: false,
        circuitOpen: false,
        activeLease: null,
        healthLevel: health.level,
        sentToday: 0,
        dailyLimit: smsConfig.dailyLimit,
        gatewayConfigured,
        dispatchEnabled: config.dispatchEnabled,
        dispatchReady,
        publishEnabled: config.publishEnabled,
      }),
      circuitOpen: false,
    };
  }

  const stuckMinutes = config.leaseMinutes * 2;

  const [
    activeLease,
    recentRuns,
    consecutiveFailures,
    minutesSinceFailure,
    lockCounts,
    failedActionable,
    staleGenerating,
    publishFailed,
    stuckPublishing,
    publishing,
    activeLeases,
    queuedForPublish,
    sentToday,
    grokQa,
  ] = await Promise.all([
    getActiveWorkerLease(),
    getRecentWorkerRuns(1),
    countConsecutiveFailures(),
    minutesSinceLastFailure(),
    getGenerationLockCounts(),
    countActionableFailedGenerationLocks(config.generationRetryMinutes),
    countStaleGeneratingLocks(config.leaseMinutes),
    countPublishFailed(),
    countStuckPublishing(stuckMinutes),
    countPublishing(),
    countActivePublishLeases(),
    countQueuedForPublish(),
    countSentToday(),
    countQaRunsByStatus(),
  ]);

  const cooldownCheck = shouldSkipForCooldown({
    consecutiveFailures,
    maxConsecutiveFailures: config.maxConsecutiveFailures,
    minutesSinceFailure,
    cooldownMinutes: config.cooldownMinutes,
    force: false,
  });

  const circuitOpen =
    consecutiveFailures >= config.maxConsecutiveFailures &&
    minutesSinceFailure !== null &&
    minutesSinceFailure < config.cooldownMinutes * 2;

  const cooldownActive =
    cooldownCheck.skip &&
    !circuitOpen &&
    (cooldownCheck.reason?.includes("Cooldown") ?? false);

  const lastRun = recentRuns[0] ?? null;

  const health = evaluateFactoryOpsHealth({
    databaseConfigured: true,
    factoryEnabled: config.enabled,
    dispatchEnabled: config.dispatchEnabled,
    publishEnabled: config.publishEnabled,
    dispatchReady,
    // Full replenish status is expensive; Factory page still loads it.
    replenish: { actionable: 0, target: 0, needed: 0 },
    worker: {
      consecutiveFailures,
      maxConsecutiveFailures: config.maxConsecutiveFailures,
      minutesSinceFailure,
      cooldownMinutes: config.cooldownMinutes,
      circuitOpen,
      cooldownActive,
      lastRunStatus: lastRun?.status ?? null,
      lastRunError: lastRun?.error ?? null,
      activeLease: activeLease
        ? { isExpired: activeLease.isExpired, status: activeLease.status }
        : null,
    },
    generationLocks: {
      generating: lockCounts.generating ?? 0,
      failed: failedActionable,
      staleGenerating,
    },
    customerPublish: {
      publishing,
      publishFailed,
      stuckPublishing,
      activeLeases,
      queuedForPublish,
    },
    grokQa: { failed: grokQa.failed },
    sms: {
      gatewayConfigured,
      queueStaleHours: null,
      queueStaleThresholdHours: 2,
    },
  });

  return {
    ...buildHealthPayload({
      databaseConfigured: true,
      circuitOpen,
      activeLease: activeLease
        ? { isExpired: activeLease.isExpired, workerId: activeLease.workerId }
        : null,
      healthLevel: health.level,
      sentToday,
      dailyLimit: smsConfig.dailyLimit,
      gatewayConfigured,
      dispatchEnabled: config.dispatchEnabled,
      dispatchReady,
      publishEnabled: config.publishEnabled,
    }),
    circuitOpen,
  };
}

/**
 * Lightweight health LEDs for admin shell / SSE / health API.
 * TTL 15s — aggregate status does not need per-request freshness.
 */
export const getAdminHealthSummary = unstable_cache(
  async (): Promise<AdminHealthSummary> => loadAdminHealthSummary(),
  ["admin-health-summary"],
  { revalidate: HEALTH_SUMMARY_REVALIDATE_SECONDS, tags: [ADMIN_HEALTH_CACHE_TAG] },
);
