import { isDatabaseConfigured } from "@/db/client";
import { getDemoLifecycleOpsAggregates } from "@/demo-lifecycle/ops-aggregates";
import { getReplenishStatus } from "@/leads/replenish-status";
import { formatProgressStatus } from "@/leads/discovery-progress";
import {
  getCustomerPublishOpsAggregates,
  listActiveCustomerPublishLeases,
} from "@/onboarding/ops-aggregates";
import { getSmsConfig, isSmsGatewayConfigured } from "@/outreach/sms/config";
import {
  countByLeadStatus,
  countSentToday,
  getSmsQueueStalenessHours,
} from "@/outreach/sms/store";
import { countQaRunsByStatus } from "@/qa/store";
import { getFactoryWorkerConfig } from "./config";
import {
  getDiscoveryProgressUpdatedAt,
  loadDiscoveryProgress,
} from "./discovery-progress-store";
import {
  countConsecutiveFailures,
  countStaleGeneratingLocks,
  getActiveWorkerLease,
  getGenerationLockCounts,
  getLastSuccessfulWorkerRun,
  getLatestWorkerRunWithError,
  getRecentWorkerRuns,
  minutesSinceLastFailure,
  shouldSkipForCooldown,
  type ActiveWorkerLease,
  type WorkerRunRecord,
} from "./lease";
import {
  countActionableFailedGenerationLocks,
  releaseStaleFailedGenerationLocks,
} from "./generation-lock";
import {
  evaluateFactoryOpsHealth,
  type FactoryOpsHealth,
  type FactoryOpsHealthInput,
} from "./ops-health";

const SMS_QUEUE_STALE_THRESHOLD_HOURS = 2;
const RECENT_RUNS_LIMIT = 15;

export type FactoryOpsSnapshot = {
  fetchedAt: string;
  databaseConfigured: boolean;
  config: {
    factoryEnabled: boolean;
    dispatchEnabled: boolean;
    publishEnabled: boolean;
    dispatchReady: boolean;
    leaseMinutes: number;
    cooldownMinutes: number;
    maxConsecutiveFailures: number;
    githubRepo: string | null;
  };
  replenish: {
    actionable: number;
    target: number;
    needed: number;
    batch: number;
  };
  worker: {
    activeLease: ActiveWorkerLease | null;
    recentRuns: WorkerRunRecord[];
    consecutiveFailures: number;
    minutesSinceFailure: number | null;
    circuitOpen: boolean;
    cooldownActive: boolean;
    lastSuccessfulRun: WorkerRunRecord | null;
    latestErrorRun: WorkerRunRecord | null;
  };
  generationLocks: Record<string, number> & {
    staleGenerating: number;
    failedActionable: number;
  };
  discovery: {
    updatedAt: string | null;
    progressUpdatedAt: string | null;
    currentRegion: string;
    currentProfession: string;
    combinationsCompleted: number;
    combinationsTotal: number;
  };
  customerPublish: Awaited<ReturnType<typeof getCustomerPublishOpsAggregates>> & {
    activeLeaseRows: Awaited<ReturnType<typeof listActiveCustomerPublishLeases>>;
  };
  demoLifecycle: Awaited<ReturnType<typeof getDemoLifecycleOpsAggregates>>;
  grokQa: {
    pending: number;
    failed: number;
  };
  sms: {
    gatewayConfigured: boolean;
    sentToday: number;
    dailyLimit: number;
    leadStatusCounts: Record<string, number>;
    queueStaleHours: number | null;
    queueStaleThresholdHours: number;
  };
  health: FactoryOpsHealth;
};

function isDispatchReady(config: ReturnType<typeof getFactoryWorkerConfig>): boolean {
  return Boolean(config.githubRepo && config.githubToken);
}

function buildHealthInput(
  snapshot: Omit<FactoryOpsSnapshot, "health">,
): FactoryOpsHealthInput {
  const lastRun = snapshot.worker.recentRuns[0] ?? null;
  return {
    databaseConfigured: snapshot.databaseConfigured,
    factoryEnabled: snapshot.config.factoryEnabled,
    dispatchEnabled: snapshot.config.dispatchEnabled,
    publishEnabled: snapshot.config.publishEnabled,
    dispatchReady: snapshot.config.dispatchReady,
    replenish: snapshot.replenish,
    worker: {
      consecutiveFailures: snapshot.worker.consecutiveFailures,
      maxConsecutiveFailures: snapshot.config.maxConsecutiveFailures,
      minutesSinceFailure: snapshot.worker.minutesSinceFailure,
      cooldownMinutes: snapshot.config.cooldownMinutes,
      circuitOpen: snapshot.worker.circuitOpen,
      cooldownActive: snapshot.worker.cooldownActive,
      lastRunStatus: lastRun?.status ?? null,
      lastRunError: lastRun?.error ?? null,
      activeLease: snapshot.worker.activeLease
        ? {
            isExpired: snapshot.worker.activeLease.isExpired,
            status: snapshot.worker.activeLease.status,
          }
        : null,
    },
    generationLocks: {
      generating: snapshot.generationLocks.generating ?? 0,
      failed: snapshot.generationLocks.failedActionable ?? 0,
      staleGenerating: snapshot.generationLocks.staleGenerating,
    },
    customerPublish: {
      publishing: snapshot.customerPublish.publishing,
      publishFailed: snapshot.customerPublish.publishFailed,
      stuckPublishing: snapshot.customerPublish.stuckPublishing,
      activeLeases: snapshot.customerPublish.activeLeases,
      queuedForPublish: snapshot.customerPublish.queuedForPublish,
    },
    demoLifecycle: {
      publishedNeverViewed: snapshot.demoLifecycle.publishedNeverViewed,
    },
    sms: {
      gatewayConfigured: snapshot.sms.gatewayConfigured,
      queueStaleHours: snapshot.sms.queueStaleHours,
      queueStaleThresholdHours: snapshot.sms.queueStaleThresholdHours,
    },
  };
}

export async function getFactoryOpsSnapshot(): Promise<FactoryOpsSnapshot> {
  const fetchedAt = new Date().toISOString();
  const databaseConfigured = isDatabaseConfigured();
  const config = getFactoryWorkerConfig();
  const smsConfig = getSmsConfig();
  const dispatchReady = isDispatchReady(config);

  const replenish = await getReplenishStatus();

  if (!databaseConfigured) {
    const discoveryProgress = await loadDiscoveryProgress();
    const discoverySummary = formatProgressStatus(discoveryProgress);
    const partial: Omit<FactoryOpsSnapshot, "health"> = {
      fetchedAt,
      databaseConfigured,
      config: {
        factoryEnabled: config.enabled,
        dispatchEnabled: config.dispatchEnabled,
        publishEnabled: config.publishEnabled,
        dispatchReady,
        leaseMinutes: config.leaseMinutes,
        cooldownMinutes: config.cooldownMinutes,
        maxConsecutiveFailures: config.maxConsecutiveFailures,
        githubRepo: config.githubRepo,
      },
      replenish,
      worker: {
        activeLease: null,
        recentRuns: [],
        consecutiveFailures: 0,
        minutesSinceFailure: null,
        circuitOpen: false,
        cooldownActive: false,
        lastSuccessfulRun: null,
        latestErrorRun: null,
      },
      generationLocks: { staleGenerating: 0, failedActionable: 0 },
      discovery: {
        updatedAt: discoveryProgress.updatedAt ?? null,
        progressUpdatedAt: discoveryProgress.updatedAt ?? null,
        currentRegion: discoverySummary.currentRegion,
        currentProfession: discoverySummary.currentProfession,
        combinationsCompleted: discoverySummary.combinationsCompleted,
        combinationsTotal: discoverySummary.combinationsTotal,
      },
      customerPublish: {
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
        activeLeaseRows: [],
      },
      demoLifecycle: {
        byStatus: {},
        totalPublished: 0,
        publishedNeverViewed: 0,
        viewedNotPurchased: 0,
        oldestGeneratedUnpublished: null,
        oldestNeverViewed: null,
      },
      grokQa: { pending: 0, failed: 0 },
      sms: {
        gatewayConfigured: isSmsGatewayConfigured(),
        sentToday: 0,
        dailyLimit: smsConfig.dailyLimit,
        leadStatusCounts: {},
        queueStaleHours: null,
        queueStaleThresholdHours: SMS_QUEUE_STALE_THRESHOLD_HOURS,
      },
    };

    return {
      ...partial,
      health: evaluateFactoryOpsHealth(buildHealthInput(partial)),
    };
  }

  await releaseStaleFailedGenerationLocks(config.generationRetryMinutes);

  const [
    activeLease,
    recentRuns,
    consecutiveFailures,
    minutesSinceFailure,
    lockCounts,
    failedActionable,
    staleGenerating,
    discoveryProgress,
    discoveryUpdatedAt,
    customerPublish,
    activePublishLeases,
    demoLifecycle,
    sentToday,
    leadStatusCounts,
    queueStaleHours,
    lastSuccessfulRun,
    latestErrorRun,
    grokQaCounts,
  ] = await Promise.all([
    getActiveWorkerLease(),
    getRecentWorkerRuns(RECENT_RUNS_LIMIT),
    countConsecutiveFailures(),
    minutesSinceLastFailure(),
    getGenerationLockCounts(),
    countActionableFailedGenerationLocks(config.generationRetryMinutes),
    countStaleGeneratingLocks(config.leaseMinutes),
    loadDiscoveryProgress(),
    getDiscoveryProgressUpdatedAt(),
    getCustomerPublishOpsAggregates(),
    listActiveCustomerPublishLeases(10),
    getDemoLifecycleOpsAggregates(),
    countSentToday(),
    countByLeadStatus(),
    getSmsQueueStalenessHours(),
    getLastSuccessfulWorkerRun(),
    getLatestWorkerRunWithError(),
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

  const discoverySummary = formatProgressStatus(discoveryProgress);

  const partial: Omit<FactoryOpsSnapshot, "health"> = {
    fetchedAt,
    databaseConfigured,
    config: {
      factoryEnabled: config.enabled,
      dispatchEnabled: config.dispatchEnabled,
      publishEnabled: config.publishEnabled,
      dispatchReady,
      leaseMinutes: config.leaseMinutes,
      cooldownMinutes: config.cooldownMinutes,
      maxConsecutiveFailures: config.maxConsecutiveFailures,
      githubRepo: config.githubRepo,
    },
    replenish,
    worker: {
      activeLease,
      recentRuns,
      consecutiveFailures,
      minutesSinceFailure,
      circuitOpen,
      cooldownActive,
      lastSuccessfulRun,
      latestErrorRun,
    },
    generationLocks: {
      ...lockCounts,
      staleGenerating,
      failedActionable,
    },
    discovery: {
      updatedAt: discoveryUpdatedAt,
      progressUpdatedAt: discoveryProgress.updatedAt ?? null,
      currentRegion: discoverySummary.currentRegion,
      currentProfession: discoverySummary.currentProfession,
      combinationsCompleted: discoverySummary.combinationsCompleted,
      combinationsTotal: discoverySummary.combinationsTotal,
    },
    customerPublish: {
      ...customerPublish,
      activeLeaseRows: activePublishLeases,
    },
    demoLifecycle,
    grokQa: grokQaCounts,
    sms: {
      gatewayConfigured: isSmsGatewayConfigured(),
      sentToday,
      dailyLimit: smsConfig.dailyLimit,
      leadStatusCounts,
      queueStaleHours,
      queueStaleThresholdHours: SMS_QUEUE_STALE_THRESHOLD_HOURS,
    },
  };

  return {
    ...partial,
    health: evaluateFactoryOpsHealth(buildHealthInput(partial)),
  };
}
