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
  grokQa: {
    failed: number;
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

  if (input.replenish.needed > 0 && input.dispatchEnabled && !input.dispatchReady) {
    add({
      level: "warning",
      code: "dispatch_not_ready",
      message:
        "Automatic replenishment is enabled but GitHub dispatch is not configured (FACTORY_GITHUB_REPO / FACTORY_GITHUB_TOKEN).",
    });
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

  if (input.grokQa.failed > 0) {
    add({
      level: "warning",
      code: "grok_qa_failed",
      message: `${input.grokQa.failed} Grok QA run(s) failed.`,
    });
  }

  return { level, issues };
}
