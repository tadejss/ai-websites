export type SmsConfig = {
  gatewaySecret: string | null;
  dailyLimit: number;
  minDelayMs: number;
  batchSize: number;
  claimLeaseMinutes: number;
  leadTarget: number;
  leadReplenishBatch: number;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getSmsConfig(): SmsConfig {
  return {
    gatewaySecret: process.env.SMS_GATEWAY_SECRET?.trim() || null,
    dailyLimit: parsePositiveInt(process.env.SMS_DAILY_LIMIT, 100),
    minDelayMs: parsePositiveInt(process.env.SMS_MIN_DELAY_MS, 3000),
    batchSize: parsePositiveInt(process.env.SMS_BATCH_SIZE, 5),
    claimLeaseMinutes: parsePositiveInt(process.env.SMS_CLAIM_LEASE_MINUTES, 10),
    leadTarget: parsePositiveInt(process.env.SMS_LEAD_TARGET, 500),
    leadReplenishBatch: parsePositiveInt(
      process.env.SMS_LEAD_REPLENISH_BATCH,
      100,
    ),
  };
}

export function isSmsGatewayConfigured(): boolean {
  return Boolean(getSmsConfig().gatewaySecret);
}

/** Gap to target; never negative. */
export function smsLeadReplenishmentNeeded(
  actionableCount: number,
  target = getSmsConfig().leadTarget,
): number {
  return Math.max(0, target - actionableCount);
}

/** Hard cap for one replenish run. */
export function smsLeadReplenishToGenerate(
  actionableCount: number,
  options?: { target?: number; batch?: number },
): number {
  const config = getSmsConfig();
  const target = options?.target ?? config.leadTarget;
  const batch = options?.batch ?? config.leadReplenishBatch;
  const needed = smsLeadReplenishmentNeeded(actionableCount, target);
  return Math.min(needed, batch);
}
