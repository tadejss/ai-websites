import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import {
  isSmsSendWindowOpen,
  ljubljanaDayUtcBounds,
  ljubljanaLocalDate,
} from "./timezone";

export const SMS_DAILY_TARGET_MIN = 40;
export const SMS_DAILY_TARGET_MAX = 50;

export type SmsDailyBudgetSnapshot = {
  localDate: string;
  target: number;
  sent: number;
  inFlight: number;
  remaining: number;
  sendWindowOpen: boolean;
  created: boolean;
};

export function randomDailySmsTarget(
  random: () => number = Math.random,
): number {
  const span = SMS_DAILY_TARGET_MAX - SMS_DAILY_TARGET_MIN + 1;
  return (
    SMS_DAILY_TARGET_MIN + Math.floor(random() * span)
  );
}

export function computeRemainingCapacity(input: {
  target: number;
  sent: number;
  inFlight: number;
}): number {
  return Math.max(0, input.target - input.sent - input.inFlight);
}

/**
 * Get or create today's durable target (40–50). Idempotent per Ljubljana date.
 */
export async function getOrCreateDailySmsBudget(input?: {
  now?: Date;
  random?: () => number;
  source?: string;
}): Promise<{ localDate: string; target: number; created: boolean }> {
  const now = input?.now ?? new Date();
  const localDate = ljubljanaLocalDate(now);
  const source = input?.source ?? "get_or_create";

  if (!isDatabaseConfigured()) {
    const target = randomDailySmsTarget(input?.random);
    return { localDate, target, created: true };
  }

  await ensureCustomerSchema();
  const db = sql();

  const existing = (await db`
    SELECT local_date, target
    FROM sms_daily_budget
    WHERE local_date = ${localDate}::date
    LIMIT 1
  `) as Array<{ local_date: string | Date; target: number }>;

  if (existing[0]) {
    return {
      localDate,
      target: Number(existing[0].target),
      created: false,
    };
  }

  const target = randomDailySmsTarget(input?.random);
  const inserted = (await db`
    INSERT INTO sms_daily_budget (local_date, target, source, created_at)
    VALUES (${localDate}::date, ${target}, ${source}, NOW())
    ON CONFLICT (local_date) DO NOTHING
    RETURNING target
  `) as Array<{ target: number }>;

  if (inserted[0]) {
    return {
      localDate,
      target: Number(inserted[0].target),
      created: true,
    };
  }

  const row = (await db`
    SELECT target
    FROM sms_daily_budget
    WHERE local_date = ${localDate}::date
    LIMIT 1
  `) as Array<{ target: number }>;

  if (!row[0]) {
    throw new Error(`Failed to persist sms_daily_budget for ${localDate}`);
  }

  return {
    localDate,
    target: Number(row[0].target),
    created: false,
  };
}

export async function countSentSmsForLocalDate(
  localDate: string,
): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }
  await ensureCustomerSchema();
  const { start, end } = ljubljanaDayUtcBounds(localDate);
  const db = sql();
  const rows = (await db`
    SELECT COUNT(*)::int AS count
    FROM sms_messages
    WHERE status = 'sent'
      AND live_eligible = TRUE
      AND sent_at >= ${start.toISOString()}
      AND sent_at < ${end.toISOString()}
  `) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

/** Live-eligible rows still consuming today's campaign capacity. */
export async function countInFlightLiveSms(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT COUNT(*)::int AS count
    FROM sms_messages
    WHERE live_eligible = TRUE
      AND status IN ('queued', 'claimed', 'sending')
  `) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

/** Canonical daily capacity snapshot (Neon is authoritative). */
export async function getDailySmsCapacity(input?: {
  now?: Date;
  random?: () => number;
  source?: string;
}): Promise<SmsDailyBudgetSnapshot> {
  const now = input?.now ?? new Date();
  const budget = await getOrCreateDailySmsBudget({
    now,
    random: input?.random,
    source: input?.source,
  });
  const sent = await countSentSmsForLocalDate(budget.localDate);
  const inFlight = await countInFlightLiveSms();
  const remaining = computeRemainingCapacity({
    target: budget.target,
    sent,
    inFlight,
  });
  return {
    localDate: budget.localDate,
    target: budget.target,
    sent,
    inFlight,
    remaining,
    sendWindowOpen: isSmsSendWindowOpen(now),
    created: budget.created,
  };
}
