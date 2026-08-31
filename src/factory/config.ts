export type FactoryWorkerConfig = {
  enabled: boolean;
  leaseMinutes: number;
  cooldownMinutes: number;
  maxConsecutiveFailures: number;
  generationRetryMinutes: number;
  publishEnabled: boolean;
  gitBranch: string;
  gitRemote: string;
  dispatchEnabled: boolean;
  githubRepo: string | null;
  githubToken: string | null;
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

export function getFactoryWorkerConfig(): FactoryWorkerConfig {
  return {
    enabled: parseBool(process.env.FACTORY_WORKER_ENABLED, true),
    leaseMinutes: parsePositiveInt(process.env.FACTORY_WORKER_LEASE_MINUTES, 90),
    cooldownMinutes: parsePositiveInt(
      process.env.FACTORY_WORKER_COOLDOWN_MINUTES,
      30,
    ),
    maxConsecutiveFailures: parsePositiveInt(
      process.env.FACTORY_WORKER_MAX_CONSECUTIVE_FAILURES,
      5,
    ),
    generationRetryMinutes: parsePositiveInt(
      process.env.FACTORY_GENERATION_RETRY_MINUTES,
      60,
    ),
    publishEnabled: parseBool(process.env.FACTORY_PUBLISH_ENABLED, true),
    gitBranch: process.env.FACTORY_GIT_BRANCH?.trim() || "main",
    gitRemote: process.env.FACTORY_GIT_REMOTE?.trim() || "origin",
    dispatchEnabled: parseBool(process.env.FACTORY_DISPATCH_ENABLED, false),
    githubRepo: process.env.FACTORY_GITHUB_REPO?.trim() || null,
    githubToken: process.env.FACTORY_GITHUB_TOKEN?.trim() || null,
  };
}
