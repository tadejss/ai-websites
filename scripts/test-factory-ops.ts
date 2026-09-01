import {
  evaluateFactoryOpsHealth,
  type FactoryOpsHealthInput,
} from "../src/factory/ops-health";

let failures = 0;

function ok(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
  }
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

function baseInput(
  overrides: Partial<FactoryOpsHealthInput> = {},
): FactoryOpsHealthInput {
  return {
    databaseConfigured: true,
    factoryEnabled: true,
    dispatchEnabled: true,
    publishEnabled: true,
    dispatchReady: true,
    replenish: { actionable: 500, target: 500, needed: 0 },
    worker: {
      consecutiveFailures: 0,
      maxConsecutiveFailures: 5,
      minutesSinceFailure: null,
      cooldownMinutes: 30,
      circuitOpen: false,
      cooldownActive: false,
      lastRunStatus: "published",
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
    demoLifecycle: { publishedNeverViewed: 0 },
    sms: {
      gatewayConfigured: true,
      queueStaleHours: null,
      queueStaleThresholdHours: 2,
    },
    ...overrides,
  };
}

function testHealthyBaseline(): void {
  const health = evaluateFactoryOpsHealth(baseInput());
  ok("healthy baseline is ok", health.level === "ok");
  ok("healthy baseline has no issues", health.issues.length === 0);
}

function testDispatchDisabledBacklogIsWarning(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({
      dispatchEnabled: false,
      replenish: { actionable: 100, target: 500, needed: 400 },
    }),
  );
  ok("dispatch disabled backlog is warning", health.level === "warning");
  ok(
    "dispatch disabled backlog code",
    health.issues.some((issue) => issue.code === "dispatch_disabled_backlog"),
  );
  ok(
    "dispatch disabled backlog is not failed",
    !health.issues.some((issue) => issue.level === "failed"),
  );
}

function testLastRunFailed(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({
      worker: {
        ...baseInput().worker,
        lastRunStatus: "failed",
        lastRunError: "publish push rejected",
      },
    }),
  );
  ok("last failed run is failed", health.level === "failed");
  ok(
    "last failed run code",
    health.issues.some((issue) => issue.code === "last_worker_run_failed"),
  );
}

function testCircuitOpen(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({
      worker: {
        ...baseInput().worker,
        consecutiveFailures: 5,
        circuitOpen: true,
        minutesSinceFailure: 10,
      },
    }),
  );
  ok("circuit open is failed", health.level === "failed");
}

function testStaleGenerationLocks(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({
      generationLocks: { generating: 2, failed: 0, staleGenerating: 1 },
    }),
  );
  ok("stale generation locks is failed", health.level === "failed");
}

function testSmsQueueStale(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({
      sms: {
        gatewayConfigured: true,
        queueStaleHours: 3,
        queueStaleThresholdHours: 2,
      },
    }),
  );
  ok("stale sms queue is failed", health.level === "failed");
}

function testDatabaseNotConfigured(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({ databaseConfigured: false }),
  );
  ok("missing database is warning", health.level === "warning");
}

function testCustomerPublishFailed(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({
      customerPublish: {
        publishing: 0,
        publishFailed: 1,
        stuckPublishing: 0,
        activeLeases: 0,
        queuedForPublish: 0,
      },
    }),
  );
  ok("customer publish failed is failed", health.level === "failed");
}

function testBacklogWithDispatchEnabled(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({
      replenish: { actionable: 100, target: 500, needed: 400 },
      dispatchEnabled: true,
      dispatchReady: true,
    }),
  );
  ok("backlog with dispatch enabled is warning", health.level === "warning");
  ok(
    "backlog gap code",
    health.issues.some((issue) => issue.code === "backlog_gap"),
  );
}

function testStuckExpiredLease(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({
      worker: {
        ...baseInput().worker,
        activeLease: { isExpired: true, status: "generating" },
      },
    }),
  );
  ok("expired stuck lease is failed", health.level === "failed");
  ok(
    "stuck lease code",
    health.issues.some((issue) => issue.code === "worker_lease_stuck"),
  );
}

function testExpiredFailedLocksDoNotWarn(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({
      generationLocks: { generating: 0, failed: 0, staleGenerating: 0 },
    }),
  );
  ok("zero actionable failed locks is ok", health.level === "ok");
  ok(
    "no failed_generation_locks issue when actionable count is zero",
    !health.issues.some((issue) => issue.code === "failed_generation_locks"),
  );
}

function testActionableFailedLocksWarn(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({
      generationLocks: { generating: 0, failed: 1, staleGenerating: 0 },
    }),
  );
  ok("actionable failed lock is warning", health.level === "warning");
  ok(
    "failed_generation_locks code present",
    health.issues.some((issue) => issue.code === "failed_generation_locks"),
  );
}

function testQueuedForPublish(): void {
  const health = evaluateFactoryOpsHealth(
    baseInput({
      customerPublish: {
        publishing: 0,
        publishFailed: 0,
        stuckPublishing: 0,
        activeLeases: 0,
        queuedForPublish: 2,
      },
    }),
  );
  ok("queued for publish is warning", health.level === "warning");
}

testHealthyBaseline();
testDispatchDisabledBacklogIsWarning();
testBacklogWithDispatchEnabled();
testLastRunFailed();
testCircuitOpen();
testStaleGenerationLocks();
testSmsQueueStale();
testDatabaseNotConfigured();
testCustomerPublishFailed();
testStuckExpiredLease();
testQueuedForPublish();
testExpiredFailedLocksDoNotWarn();
testActionableFailedLocksWarn();

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}

console.log("\nAll factory ops tests passed");
