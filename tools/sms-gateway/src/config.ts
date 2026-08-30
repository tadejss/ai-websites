import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

export type GatewayConfig = {
  apiBaseUrl: string;
  gatewaySecret: string;
  localSecret: string;
  dryRun: boolean;
  minDelayMs: number;
  batchSize: number;
  dailyLimit: number;
  pollIntervalMs: number;
  hilinkUrl: string;
  host: string;
  port: number;
};

const gatewayRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

loadDotenv({ path: path.join(gatewayRoot, ".env") });

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadGatewayConfig(): GatewayConfig {
  const gatewaySecret = process.env.SMS_GATEWAY_SECRET?.trim();
  const localSecret = process.env.SMS_GATEWAY_LOCAL_SECRET?.trim();
  if (!gatewaySecret) {
    throw new Error("SMS_GATEWAY_SECRET is required");
  }
  if (!localSecret) {
    throw new Error("SMS_GATEWAY_LOCAL_SECRET is required");
  }

  return {
    apiBaseUrl: (
      process.env.SMS_API_BASE_URL?.trim() || "https://zbrendiraj.si"
    ).replace(/\/$/, ""),
    gatewaySecret,
    localSecret,
    dryRun: process.env.SMS_DRY_RUN?.trim() === "true",
    minDelayMs: parsePositiveInt(process.env.SMS_MIN_DELAY_MS, 3000),
    batchSize: parsePositiveInt(process.env.SMS_BATCH_SIZE, 5),
    dailyLimit: parsePositiveInt(process.env.SMS_DAILY_LIMIT, 100),
    pollIntervalMs: parsePositiveInt(process.env.SMS_POLL_INTERVAL_MS, 15000),
    hilinkUrl: (
      process.env.HILINK_URL?.trim() || "http://192.168.8.1"
    ).replace(/\/$/, ""),
    host: "127.0.0.1",
    port: parsePositiveInt(process.env.SMS_GATEWAY_PORT, 8787),
  };
}
