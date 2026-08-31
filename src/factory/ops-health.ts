export type OpsHealthLevel = "ok" | "warning" | "failed";

export type OpsHealthIssue = {
  level: OpsHealthLevel;
  code: string;
  message: string;
};

export type FactoryOpsHealthInput = {
  databaseConfigured: boolean;
  factoryEnabled: boolean;
  dispatchEnabled: boolean;
  publishEnabled: boolean;
  dispatchReady: boolean;
  replenish: {
    actionable: number;
    target: number;
    needed: number;
  };
  worker: {
    consecutiveFailures: number;
    maxConsecutiveFailures: number;
    minutesSinceFailure: number | null;
    cooldownMinutes: number;
    circuitOpen: boolean;
    cooldownActive: boolean;
    lastRunStatus: string | null;
    lastRunError: string | null;
    activeLease: { isExpired: boolean; status: string } | null;
  };
  generationLocks: {
    generating: number;
    failed: number;
    staleGenerating: number;
  };
  customerPublish: {
    publishing: number;
    publishFailed: number;
    stuckPublishing: number;
    activeLeases: number;
    queuedForPublish: number;
  };
  demoLifecycle: {
    publishedNeverViewed: number;
  };
  sms: {
    gatewayConfigured: boolean;
    queueStaleHours: number | null;
    queueStaleThresholdHours: number;
  };
};

export type FactoryOpsHealth = {
  level: OpsHealthLevel;
  issues: OpsHealthIssue[];
};

const LEVEL_ORDER: Record<OpsHealthLevel, number> = {
  ok: 0,
  warning: 1,
  failed: 2,
};

function maxLevel(a: OpsHealthLevel, b: OpsHealthLevel): OpsHealthLevel {
  return LEVEL_ORDER[a] >= LEVEL_ORDER[b] ? a : b;
}

export function evaluateFactoryOpsHealth(
  input: FactoryOpsHealthInput,
): FactoryOpsHealth {
  const issues: OpsHealthIssue[] = [];
  let level: OpsHealthLevel = "ok";

  function add(issue: OpsHealthIssue): void {
    issues.push(issue);
    level = maxLevel(level, issue.level);
  }

  if (!input.databaseConfigured) {
    add({
      level: "warning",
      code: "database_not_configured",
      message: "DATABASE_URL is not configured; factory ops data is unavailable.",
    });
    return { level, issues };
  }

  if (!input.factoryEnabled) {
    add({
      level: "warning",
      code: "factory_worker_disabled",
      message: "Factory worker is disabled (FACTORY_WORKER_ENABLED=false).",
    });
  }

  if (input.replenish.needed > 0) {
    if (!input.dispatchEnabled) {
      add({
        level: "warning",
        code: "dispatch_disabled_backlog",
        message: `Lead backlog needs ${input.replenish.needed} more demos, but automatic replenishment is disabled (FACTORY_DISPATCH_ENABLED=false).`,
      });
    } else if (!input.dispatchReady) {
      add({
        level: "warning",
        code: "dispatch_not_ready",
        message:
          "Automatic replenishment is enabled but GitHub dispatch is not configured (FACTORY_GITHUB_REPO / FACTORY_GITHUB_TOKEN).",
      });
    } else {
      add({
        level: "warning",
        code: "backlog_gap",
        message: `Lead backlog needs ${input.replenish.needed} more demos to reach target.`,
      });
    }
  }

  if (input.worker.lastRunStatus === "failed") {
    add({
      level: "failed",
      code: "last_worker_run_failed",
      message: input.worker.lastRunError
        ? `Last factory worker run failed: ${input.worker.lastRunError}`
        : "Last factory worker run failed.",
    });
  }

  if (input.worker.circuitOpen) {
    add({
      level: "failed",
      code: "circuit_open",
      message: `Factory worker circuit is open after ${input.worker.consecutiveFailures} consecutive failures.`,
    });
  } else if (input.worker.cooldownActive) {
    add({
      level: "warning",
      code: "cooldown_active",
      message: "Factory worker cooldown is active after a recent failure.",
    });
  }

  if (
    input.worker.activeLease &&
    input.worker.activeLease.isExpired &&
    input.worker.activeLease.status !== "published" &&
    input.worker.activeLease.status !== "failed" &&
    input.worker.activeLease.status !== "skipped"
  ) {
    add({
      level: "failed",
      code: "worker_lease_stuck",
      message: `Factory worker lease expired but still present (status: ${input.worker.activeLease.status}).`,
    });
  } else if (
    input.worker.activeLease &&
    !input.worker.activeLease.isExpired &&
    input.worker.activeLease.status !== "published" &&
    input.worker.activeLease.status !== "failed" &&
    input.worker.activeLease.status !== "skipped"
  ) {
    add({
      level: "warning",
      code: "worker_lease_active",
      message: `Factory worker lease is active (status: ${input.worker.activeLease.status}).`,
    });
  }

  if (input.generationLocks.staleGenerating > 0) {
    add({
      level: "failed",
      code: "stale_generation_locks",
      message: `${input.generationLocks.staleGenerating} generation lock(s) stuck in generating state.`,
    });
  }

  if (input.generationLocks.failed > 0) {
    add({
      level: "warning",
      code: "failed_generation_locks",
      message: `${input.generationLocks.failed} generation lock(s) in failed state.`,
    });
  }

  if (input.customerPublish.publishFailed > 0) {
    add({
      level: "failed",
      code: "customer_publish_failed",
      message: `${input.customerPublish.publishFailed} customer site(s) in publish_failed state.`,
    });
  }

  if (input.customerPublish.stuckPublishing > 0) {
    add({
      level: "failed",
      code: "customer_publish_stuck",
      message: `${input.customerPublish.stuckPublishing} customer site(s) stuck in publishing.`,
    });
  }

  if (input.customerPublish.queuedForPublish > 0) {
    add({
      level: "warning",
      code: "customer_publish_queued",
      message: `${input.customerPublish.queuedForPublish} customer site(s) approved and waiting to publish.`,
    });
  }

  if (
    input.sms.gatewayConfigured &&
    input.sms.queueStaleHours !== null &&
    input.sms.queueStaleHours >= input.sms.queueStaleThresholdHours
  ) {
    add({
      level: "failed",
      code: "sms_queue_stale",
      message: `SMS queue has messages waiting ${input.sms.queueStaleHours.toFixed(1)}h (threshold ${input.sms.queueStaleThresholdHours}h).`,
    });
  }

  if (
    input.demoLifecycle.publishedNeverViewed > 0 &&
    input.replenish.needed === 0
  ) {
    add({
      level: "warning",
      code: "published_never_viewed",
      message: `${input.demoLifecycle.publishedNeverViewed} published demo(s) have never been viewed.`,
    });
  }

  if (!input.publishEnabled) {
    add({
      level: "warning",
      code: "factory_publish_disabled",
      message: "Factory git publish is disabled (FACTORY_PUBLISH_ENABLED=false).",
    });
  }

  return { level, issues };
}
