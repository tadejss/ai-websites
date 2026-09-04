import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import { getFactoryWorkerConfig } from "@/factory/config";
import { readLead } from "@/leads/store";
import { clientSiteExists } from "@/leads/client-exists";
import { isGrokQaEnabled } from "@/qa/config";
import { listFailedQaLatest } from "@/qa/store";
import { ensureAdminSchema } from "@/admin/entity-index";
import type { AdminAction } from "@/admin/entity";
import { buildAdminActions } from "@/admin/entity";
import { canAdminApproveOnboarding, canRetryCustomerPublish } from "@/onboarding/types";
import { getOnboardingBySlug } from "@/onboarding/store";
import { evaluateSmsEligibility } from "@/outreach/sms/eligibility";
import { resolveDueSmsStep } from "@/outreach/sms/enqueue-batch";
import {
  getSmsLeadState,
  hasActiveOrSentStep,
} from "@/outreach/sms/store";
import { isCustomer } from "@/customers/store";
import { readLead as readLeadRecord } from "@/leads/store";

export type QueueItemKind =
  | "publish_failed"
  | "stuck_publishing"
  | "onboarding_review"
  | "qa_failed";

export type QueueItemCore = {
  slug: string;
  companyName: string;
  kind: QueueItemKind;
  score: number;
  subtitle: string;
  updatedAt: string | null;
  href: string;
};

export type QueueItem = QueueItemCore & {
  actions: AdminAction[];
};

const SCORE: Record<QueueItemKind, number> = {
  publish_failed: 1000,
  stuck_publishing: 900,
  onboarding_review: 800,
  qa_failed: 700,
};

function sortQueueItems(items: QueueItemCore[]): QueueItemCore[] {
  return [...items].sort(
    (a, b) =>
      b.score - a.score || (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );
}

export function countQueueKinds(
  items: QueueItemCore[],
): Record<QueueItemKind, number> {
  const counts: Record<QueueItemKind, number> = {
    publish_failed: 0,
    stuck_publishing: 0,
    onboarding_review: 0,
    qa_failed: 0,
  };
  for (const item of items) {
    counts[item.kind] += 1;
  }
  return counts;
}

export async function getSnoozedSlugs(): Promise<Set<string>> {
  if (!isDatabaseConfigured()) {
    return new Set();
  }
  await ensureAdminSchema();
  const db = sql();
  const rows = (await db`
    SELECT slug FROM admin_queue_snooze WHERE until_at > NOW()
  `) as Array<{ slug: string }>;
  return new Set(rows.map((row) => row.slug));
}

export async function snoozeQueueItem(input: {
  slug: string;
  until: string;
  reason?: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }
  await ensureAdminSchema();
  const db = sql();
  await db`
    INSERT INTO admin_queue_snooze (slug, until_at, reason)
    VALUES (${input.slug}, ${input.until}, ${input.reason ?? null})
    ON CONFLICT (slug) DO UPDATE SET
      until_at = EXCLUDED.until_at,
      reason = EXCLUDED.reason,
      created_at = NOW()
  `;
}

async function buildQueueActions(slug: string): Promise<AdminAction[]> {
  const lead = readLeadRecord(slug);
  if (!lead) {
    return buildAdminActions({
      slug,
      canQueueSms: false,
      canRetrySms: false,
      canApprove: false,
      canRetryPublish: false,
      onboardingUrl: null,
    });
  }

  const isCustomerLead = await isCustomer(slug);
  const onboarding = isCustomerLead ? await getOnboardingBySlug(slug) : null;
  const smsState = await getSmsLeadState(slug);
  const smsDueStep = await resolveDueSmsStep(slug, lead.status);
  const smsAlready = smsDueStep
    ? await hasActiveOrSentStep(slug, smsDueStep)
    : false;
  const smsEligibility = evaluateSmsEligibility({
    lead,
    isCustomer: isCustomerLead,
    state: smsState,
    step: smsDueStep ?? "initial",
    alreadySentForStep: smsAlready,
  });

  return buildAdminActions({
    slug,
    canQueueSms: smsEligibility.ok,
    canRetrySms: false,
    smsIneligibility: smsEligibility.ok ? null : smsEligibility.reason,
    canApprove: onboarding
      ? canAdminApproveOnboarding(onboarding.status)
      : false,
    canRetryPublish: onboarding
      ? canRetryCustomerPublish(onboarding.status)
      : false,
    onboardingUrl: null,
    canRunQa: clientSiteExists(slug) && isGrokQaEnabled(),
  });
}

/**
 * Shared queue membership + ordering (no actions).
 * Same SQL limits, snooze skip, QA dedup, score sort, and slice as getActionQueue.
 */
export async function collectQueueItems(limit = 20): Promise<QueueItemCore[]> {
  const snoozed = await getSnoozedSlugs();
  const items: QueueItemCore[] = [];

  if (isDatabaseConfigured()) {
    await ensureCustomerSchema();
    const db = sql();
    const config = getFactoryWorkerConfig();
    const stuckMinutes = config.leaseMinutes * 2;

    const failedRows = (await db`
      SELECT slug, publish_error, updated_at
      FROM customer_onboarding
      WHERE status = 'publish_failed'
      ORDER BY updated_at DESC
      LIMIT 20
    `) as Array<{
      slug: string;
      publish_error: string | null;
      updated_at: Date | string;
    }>;

    for (const row of failedRows) {
      if (snoozed.has(row.slug)) continue;
      const lead = readLead(row.slug);
      items.push({
        slug: row.slug,
        companyName: lead?.companyName ?? row.slug,
        kind: "publish_failed",
        score: SCORE.publish_failed,
        subtitle: row.publish_error?.slice(0, 80) ?? "publish_failed",
        updatedAt:
          row.updated_at instanceof Date
            ? row.updated_at.toISOString()
            : new Date(row.updated_at).toISOString(),
        href: `/admin/e/${row.slug}`,
      });
    }

    const stuckRows = (await db`
      SELECT slug, updated_at
      FROM customer_onboarding
      WHERE status = 'publishing'
        AND COALESCE(publish_started_at, updated_at) < NOW() - (${stuckMinutes}::text || ' minutes')::interval
      ORDER BY updated_at ASC
      LIMIT 20
    `) as Array<{ slug: string; updated_at: Date | string }>;

    for (const row of stuckRows) {
      if (snoozed.has(row.slug)) continue;
      const lead = readLead(row.slug);
      items.push({
        slug: row.slug,
        companyName: lead?.companyName ?? row.slug,
        kind: "stuck_publishing",
        score: SCORE.stuck_publishing,
        subtitle: "stuck publishing",
        updatedAt:
          row.updated_at instanceof Date
            ? row.updated_at.toISOString()
            : new Date(row.updated_at).toISOString(),
        href: `/admin/e/${row.slug}`,
      });
    }

    const reviewRows = (await db`
      SELECT slug, status, updated_at, answers->>'companyName' AS company_name
      FROM customer_onboarding
      WHERE status IN ('submitted', 'processing', 'ready_for_approval')
      ORDER BY updated_at DESC
      LIMIT 30
    `) as Array<{
      slug: string;
      status: string;
      updated_at: Date | string;
      company_name: string | null;
    }>;

    for (const row of reviewRows) {
      if (snoozed.has(row.slug)) continue;
      items.push({
        slug: row.slug,
        companyName: row.company_name ?? row.slug,
        kind: "onboarding_review",
        score: SCORE.onboarding_review,
        subtitle: row.status.replaceAll("_", " "),
        updatedAt:
          row.updated_at instanceof Date
            ? row.updated_at.toISOString()
            : new Date(row.updated_at).toISOString(),
        href: `/admin/e/${row.slug}`,
      });
    }
  }

  const qaFailed = await listFailedQaLatest(20);
  for (const row of qaFailed) {
    if (snoozed.has(row.slug)) continue;
    if (items.some((item) => item.slug === row.slug)) continue;
    const lead = readLead(row.slug);
    items.push({
      slug: row.slug,
      companyName: lead?.companyName ?? row.slug,
      kind: "qa_failed",
      score: SCORE.qa_failed,
      subtitle:
        row.policyStatus === "fail"
          ? "QA policy fail"
          : (row.lastError?.slice(0, 80) ?? "QA run failed"),
      updatedAt: row.updatedAt,
      href: `/admin/e/${row.slug}`,
    });
  }

  return sortQueueItems(items).slice(0, limit);
}

export async function getActionQueue(limit = 20): Promise<QueueItem[]> {
  const items = await collectQueueItems(limit);
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      actions: await buildQueueActions(item.slug),
    })),
  );
}

export async function getQueueCounts(): Promise<Record<QueueItemKind, number>> {
  return countQueueKinds(await collectQueueItems(200));
}

export async function getQueueNeighbors(slug: string): Promise<{
  prev: string | null;
  next: string | null;
  index: number;
  total: number;
}> {
  const queue = await collectQueueItems(200);
  const index = queue.findIndex((item) => item.slug === slug);
  if (index < 0) {
    return { prev: null, next: null, index: -1, total: queue.length };
  }
  return {
    prev: index > 0 ? queue[index - 1].slug : null,
    next: index < queue.length - 1 ? queue[index + 1].slug : null,
    index,
    total: queue.length,
  };
}
