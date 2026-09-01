import { getFactoryOpsSnapshot } from "@/factory/ops-snapshot";
import type { HealthPayload } from "@/components/admin/admin-health-strip";

function workerLevel(
  snapshot: Awaited<ReturnType<typeof getFactoryOpsSnapshot>>,
): HealthPayload["factory"] {
  if (!snapshot.databaseConfigured) {
    return { level: "idle", detail: "no DB" };
  }
  if (snapshot.worker.circuitOpen) {
    return { level: "failed", detail: "circuit open" };
  }
  if (snapshot.worker.activeLease && !snapshot.worker.activeLease.isExpired) {
    return {
      level: "ok",
      detail: `lease ${snapshot.worker.activeLease.workerId.slice(0, 8)}`,
    };
  }
  if (snapshot.health.level === "failed") {
    return { level: "failed", detail: "issues" };
  }
  if (snapshot.health.level === "warning") {
    return { level: "warning", detail: "check factory" };
  }
  return { level: "ok", detail: "idle" };
}

export async function getAdminHealthPayload(): Promise<HealthPayload> {
  const snapshot = await getFactoryOpsSnapshot();

  const smsLevel: HealthPayload["sms"]["level"] =
    snapshot.sms.sentToday >= snapshot.sms.dailyLimit
      ? "warning"
      : "ok";

  const gatewayLevel: HealthPayload["gateway"]["level"] =
    snapshot.sms.gatewayConfigured ? "ok" : "failed";

  let dispatchLevel: HealthPayload["dispatch"]["level"] = "ok";
  let dispatchDetail = "ready";
  if (!snapshot.config.dispatchEnabled) {
    dispatchLevel = "warning";
    dispatchDetail = "dispatch off";
  } else if (!snapshot.config.dispatchReady) {
    dispatchLevel = "failed";
    dispatchDetail = "missing GH creds";
  } else if (!snapshot.config.publishEnabled) {
    dispatchLevel = "warning";
    dispatchDetail = "publish off";
  }

  return {
    factory: workerLevel(snapshot),
    sms: {
      level: smsLevel,
      detail: `${snapshot.sms.sentToday}/${snapshot.sms.dailyLimit}`,
    },
    gateway: {
      level: gatewayLevel,
      detail: snapshot.sms.gatewayConfigured ? "online" : "offline",
    },
    dispatch: { level: dispatchLevel, detail: dispatchDetail },
  };
}
