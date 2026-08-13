export type OutreachConfig = {
  resendApiKey: string | null;
  fromEmail: string | null;
  fromName: string | null;
  dryRun: boolean;
  batchSize: number;
  cronSecret: string | null;
  adminSecret: string | null;
  webhookSecret: string | null;
  followup1Days: number;
  followup2Days: number;
};

function readInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBool(name: string, fallback = false): boolean {
  const raw = process.env[name]?.trim().toLowerCase();

  if (!raw) {
    return fallback;
  }

  return raw === "1" || raw === "true" || raw === "yes";
}

export function getOutreachConfig(): OutreachConfig {
  return {
    resendApiKey: process.env.RESEND_API_KEY?.trim() || null,
    fromEmail: process.env.OUTREACH_FROM_EMAIL?.trim() || null,
    fromName: process.env.OUTREACH_FROM_NAME?.trim() || null,
    dryRun: readBool("OUTREACH_DRY_RUN", false),
    batchSize: readInt("OUTREACH_BATCH_SIZE", 10),
    cronSecret: process.env.CRON_SECRET?.trim() || null,
    adminSecret: process.env.ADMIN_SECRET?.trim() || null,
    webhookSecret:
      process.env.RESEND_WEBHOOK_SECRET?.trim() ||
      process.env.RESEND_SIGNING_SECRET?.trim() ||
      null,
    followup1Days: readInt("OUTREACH_FOLLOWUP_1_DAYS", 3),
    followup2Days: readInt("OUTREACH_FOLLOWUP_2_DAYS", 7),
  };
}

export function isOutreachConfigured(config: OutreachConfig = getOutreachConfig()): boolean {
  if (config.dryRun) {
    return true;
  }

  return Boolean(config.resendApiKey && config.fromEmail);
}

export function formatFromAddress(config: OutreachConfig): string | null {
  if (!config.fromEmail) {
    return null;
  }

  if (config.fromName) {
    return `${config.fromName} <${config.fromEmail}>`;
  }

  return config.fromEmail;
}
