export type SmsConfig = {
  gatewaySecret: string | null;
  dailyLimit: number;
  minDelayMs: number;
  batchSize: number;
  claimLeaseMinutes: number;
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
  };
}

export function isSmsGatewayConfigured(): boolean {
  return Boolean(getSmsConfig().gatewaySecret);
}
