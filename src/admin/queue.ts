import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import { getFactoryWorkerConfig } from "@/factory/config";
import {
  buildAdminLeadRows,
  filterAdminLeadRows,
} from "@/admin/leads-filters";
import { readLead, readAllLeads } from "@/leads/store";
import { getCustomerSlugSet } from "@/customers/store";
import { listSmsLeadStates } from "@/outreach/sms/store";
import {
  backfillPublishedFromFactoryLocks,
  getDemoLifecycleBySlugs,
} from "@/demo-lifecycle/store";
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
  | "never_viewed"
  | "actionable_sms";

export type QueueItem = {
  slug: string;
  companyName: string;
  kind: QueueItemKind;
  score: number;
  subtitle: string;
  updatedAt: string | null;
  href: string;
  actions: AdminAction[];
};

const SCORE: Record<QueueItemKind, number> = {
  publish_failed: 1000,
  stuck_publishing: 900,
  onboarding_review: 800,
  never_viewed: 500,
  actionable_sms: 400,
};

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
  });
}

export async function getActionQueue(limit = 50): Promise<QueueItem[]> {
  const snoozed = await getSnoozedSlugs();
  const items: QueueItem[] = [];

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
        actions: await buildQueueActions(row.slug),
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
        actions: await buildQueueActions(row.slug),
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
        actions: await buildQueueActions(row.slug),
      });
    }
  }

  const customerSlugs = await getCustomerSlugSet();
  const allLeads = readAllLeads();
  const slugs = allLeads.map((lead) => lead.slug);
  let lifecycleBySlug = isDatabaseConfigured()
    ? await getDemoLifecycleBySlugs(slugs)
    : new Map();
  if (isDatabaseConfigured() && slugs.length > 0) {
    await backfillPublishedFromFactoryLocks(slugs);
    lifecycleBySlug = await getDemoLifecycleBySlugs(slugs);
  }
  const smsStates = isDatabaseConfigured() ? await listSmsLeadStates() : [];
  const smsBySlug = new Map(smsStates.map((state) => [state.slug, state]));
  const allRows = buildAdminLeadRows(
    allLeads,
    customerSlugs,
    smsBySlug,
    lifecycleBySlug,
  );

  const neverViewed = filterAdminLeadRows(allRows, { pipeline: "never_viewed" });
  for (const row of neverViewed.slice(0, 20)) {
    if (snoozed.has(row.lead.slug)) continue;
    if (items.some((item) => item.slug === row.lead.slug)) continue;
    items.push({
      slug: row.lead.slug,
      companyName: row.lead.companyName ?? row.lead.slug,
      kind: "never_viewed",
      score: SCORE.never_viewed,
      subtitle: "never viewed",
      updatedAt: row.lifecycle?.publishedAt ?? null,
      href: `/admin/e/${row.lead.slug}`,
      actions: await buildQueueActions(row.lead.slug),
    });
  }

  const actionable = filterAdminLeadRows(allRows, { pipeline: "actionable" });
  for (const row of actionable.slice(0, 30)) {
    if (snoozed.has(row.lead.slug)) continue;
    if (items.some((item) => item.slug === row.lead.slug)) continue;
    items.push({
      slug: row.lead.slug,
      companyName: row.lead.companyName ?? row.lead.slug,
      kind: "actionable_sms",
      score: SCORE.actionable_sms,
      subtitle: "actionable SMS",
      updatedAt: row.lifecycle?.lastViewedAt ?? row.lifecycle?.publishedAt ?? null,
      href: `/admin/e/${row.lead.slug}`,
      actions: await buildQueueActions(row.lead.slug),
    });
  }

  return items
    .sort((a, b) => b.score - a.score || (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, limit);
}

export async function getQueueCounts(): Promise<Record<QueueItemKind, number>> {
  const queue = await getActionQueue(200);
  const counts: Record<QueueItemKind, number> = {
    publish_failed: 0,
    stuck_publishing: 0,
    onboarding_review: 0,
    never_viewed: 0,
    actionable_sms: 0,
  };
  for (const item of queue) {
    counts[item.kind] += 1;
  }
  return counts;
}

export async function getQueueNeighbors(slug: string): Promise<{
  prev: string | null;
  next: string | null;
  index: number;
  total: number;
}> {
  const queue = await getActionQueue(200);
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
