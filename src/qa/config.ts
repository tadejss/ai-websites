export type GrokQaConfig = {
  enabled: boolean;
  apiKey: string | null;
  model: string;
  maxAttempts: number;
  maxPerWorkerRun: number;
  failOnMedium: boolean;
  maxIssues: number;
  leaseMinutes: number;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function getGrokQaConfig(): GrokQaConfig {
  const apiKey = process.env.XAI_API_KEY?.trim() || null;
  const enabledFlag = parseBool(process.env.GROK_QA_ENABLED, true);

  return {
    enabled: enabledFlag,
    apiKey,
    model: process.env.GROK_MODEL?.trim() || "grok-4.6",
    maxAttempts: parsePositiveInt(process.env.GROK_QA_MAX_ATTEMPTS, 2),
    maxPerWorkerRun: parsePositiveInt(process.env.GROK_QA_MAX_PER_WORKER_RUN, 20),
    failOnMedium: parseBool(process.env.GROK_QA_FAIL_ON_MEDIUM, false),
    maxIssues: parsePositiveInt(process.env.GROK_QA_MAX_ISSUES, 25),
    leaseMinutes: parsePositiveInt(process.env.GROK_QA_LEASE_MINUTES, 10),
  };
}

export function isGrokQaEnabled(): boolean {
  return getGrokQaConfig().enabled;
}

export function isGrokQaConfigured(): boolean {
  const config = getGrokQaConfig();
  return config.enabled && Boolean(config.apiKey);
}
