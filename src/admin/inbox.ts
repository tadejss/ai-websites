import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import { getCustomerPublishOpsAggregates } from "@/onboarding/ops-aggregates";
import { readAllLeads } from "@/leads/store";
import { getCustomerSlugSet } from "@/customers/store";
import { listSmsLeadStates } from "@/outreach/sms/store";
import {
  backfillPublishedFromFactoryLocks,
  getDemoLifecycleBySlugs,
} from "@/demo-lifecycle/store";
import {
  buildAdminLeadRows,
  filterAdminLeadRows,
} from "@/admin/leads-filters";
import { readLead } from "@/leads/store";

export type InboxItem = {
  slug: string;
  companyName: string;
  subtitle: string;
  updatedAt: string | null;
  href: string;
};

export type AdminInboxData = {
  onboardingReview: InboxItem[];
  publishFailed: InboxItem[];
  smsActionable: InboxItem[];
  counts: {
    onboardingReview: number;
    publishFailed: number;
    smsActionable: number;
  };
};

function leadCompanyName(slug: string, fallback?: string | null): string {
  return fallback?.trim() || slug;
}

export async function getOnboardingReviewInbox(limit = 10): Promise<InboxItem[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT o.slug, o.status, o.updated_at, o.contact_name,
           o.answers->>'companyName' AS company_name
    FROM customer_onboarding o
    WHERE o.status IN ('submitted', 'processing', 'ready_for_approval')
    ORDER BY o.updated_at DESC
    LIMIT ${limit}
  `) as Array<{
    slug: string;
    status: string;
    updated_at: Date | string;
    contact_name: string | null;
    company_name: string | null;
  }>;

  return rows.map((row) => ({
    slug: row.slug,
    companyName: leadCompanyName(row.slug, row.company_name ?? row.contact_name),
    subtitle: row.status.replaceAll("_", " "),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString(),
    href: `/admin/e/${row.slug}`,
  }));
}

export async function getPublishFailedInbox(limit = 10): Promise<InboxItem[]> {
  const aggregates = await getCustomerPublishOpsAggregates();
  const items: InboxItem[] = [];

  for (const row of aggregates.publishFailedRows.slice(0, limit)) {
    const lead = readLead(row.slug);
    items.push({
      slug: row.slug,
      companyName: leadCompanyName(row.slug, lead?.companyName),
      subtitle: row.publishError?.slice(0, 80) ?? "publish_failed",
      updatedAt: row.updatedAt,
      href: `/admin/e/${row.slug}`,
    });
  }

  if (aggregates.stuckPublishing > 0 && isDatabaseConfigured()) {
    await ensureCustomerSchema();
    const db = sql();
    const stuckRows = (await db`
      SELECT slug, updated_at, publish_error
      FROM customer_onboarding
      WHERE status = 'publishing'
      ORDER BY updated_at ASC
      LIMIT ${Math.max(0, limit - items.length)}
    `) as Array<{
      slug: string;
      updated_at: Date | string;
      publish_error: string | null;
    }>;

    for (const row of stuckRows) {
      if (items.some((item) => item.slug === row.slug)) {
        continue;
      }
      const lead = readLead(row.slug);
      items.push({
        slug: row.slug,
        companyName: leadCompanyName(row.slug, lead?.companyName),
        subtitle: "stuck publishing",
        updatedAt:
          row.updated_at instanceof Date
            ? row.updated_at.toISOString()
            : new Date(row.updated_at).toISOString(),
        href: `/admin/e/${row.slug}`,
      });
    }
  }

  return items.slice(0, limit);
}

export async function getSmsActionableInbox(limit = 10): Promise<InboxItem[]> {
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

  const actionable = filterAdminLeadRows(allRows, { pipeline: "actionable" });
  const neverViewed = filterAdminLeadRows(allRows, { pipeline: "never_viewed" });

  const prioritized = [...neverViewed, ...actionable].filter(
    (row, index, arr) =>
      arr.findIndex((candidate) => candidate.lead.slug === row.lead.slug) ===
      index,
  );

  return prioritized.slice(0, limit).map((row) => ({
    slug: row.lead.slug,
    companyName: leadCompanyName(row.lead.slug, row.lead.companyName),
    subtitle: row.isNeverViewed
      ? "never viewed"
      : row.lifecycle?.lifecycleStatus ?? "actionable",
    updatedAt: row.lifecycle?.lastViewedAt ?? row.lifecycle?.publishedAt ?? null,
    href: `/admin/e/${row.lead.slug}`,
  }));
}

async function countOnboardingReview(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT COUNT(*)::int AS count
    FROM customer_onboarding
    WHERE status IN ('submitted', 'processing', 'ready_for_approval')
  `) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

async function countPublishFailed(): Promise<number> {
  const aggregates = await getCustomerPublishOpsAggregates();
  let total = aggregates.publishFailedRows.length + aggregates.stuckPublishing;
  if (isDatabaseConfigured()) {
    await ensureCustomerSchema();
    const db = sql();
    const rows = (await db`
      SELECT COUNT(*)::int AS count
      FROM customer_onboarding
      WHERE status = 'publish_failed'
    `) as Array<{ count: number }>;
    total = rows[0]?.count ?? 0;
    const stuckRows = (await db`
      SELECT COUNT(*)::int AS count
      FROM customer_onboarding
      WHERE status = 'publishing'
    `) as Array<{ count: number }>;
    total += stuckRows[0]?.count ?? 0;
  }
  return total;
}

async function countSmsActionable(): Promise<number> {
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

  const actionable = filterAdminLeadRows(allRows, { pipeline: "actionable" });
  const neverViewed = filterAdminLeadRows(allRows, { pipeline: "never_viewed" });
  const seen = new Set<string>();
  let count = 0;
  for (const row of [...neverViewed, ...actionable]) {
    if (seen.has(row.lead.slug)) continue;
    seen.add(row.lead.slug);
    count += 1;
  }
  return count;
}

export async function getAdminInboxData(): Promise<AdminInboxData> {
  const [
    onboardingReview,
    publishFailed,
    smsActionable,
    onboardingCount,
    publishCount,
    smsCount,
  ] = await Promise.all([
    getOnboardingReviewInbox(10),
    getPublishFailedInbox(10),
    getSmsActionableInbox(10),
    countOnboardingReview(),
    countPublishFailed(),
    countSmsActionable(),
  ]);

  return {
    onboardingReview,
    publishFailed,
    smsActionable,
    counts: {
      onboardingReview: onboardingCount,
      publishFailed: publishCount,
      smsActionable: smsCount,
    },
  };
}
