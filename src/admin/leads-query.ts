import {
  buildAdminLeadRows,
  filterAdminLeadRows,
  type AdminLeadListFilters,
  type AdminPipelineView,
} from "@/admin/leads-filters";
import { getCustomerSlugSet } from "@/customers/store";
import { isDatabaseConfigured } from "@/db/client";
import {
  backfillPublishedFromFactoryLocks,
  getDemoLifecycleBySlugs,
} from "@/demo-lifecycle/store";
import { readAllLeads, readLead } from "@/leads/store";
import { listSmsLeadStatesBySlugs } from "@/outreach/sms/store";
import {
  queryEntityIndex,
  searchEntityIndex,
  type EntityIndexRow,
} from "@/admin/entity-index";

export type AdminLeadsQuery = {
  page?: number;
  pageSize?: number;
  pipeline?: AdminPipelineView;
  q?: string;
  sort?: "company" | "demo_age" | "views" | "activity";
  status?: string;
  outreach?: string;
};

export type AdminLeadsPageResult = {
  rows: ReturnType<typeof buildAdminLeadRows>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

async function enrichIndexRows(
  indexRows: EntityIndexRow[],
  filters: AdminLeadListFilters,
): Promise<ReturnType<typeof buildAdminLeadRows>> {
  const customerSlugs = await getCustomerSlugSet();
  const slugs = indexRows.map((row) => row.slug);
  const leads = slugs.map((slug) => readLead(slug)).filter(Boolean) as NonNullable<
    ReturnType<typeof readLead>
  >[];

  let lifecycleBySlug = isDatabaseConfigured()
    ? await getDemoLifecycleBySlugs(slugs)
    : new Map();

  if (isDatabaseConfigured() && slugs.length > 0) {
    await backfillPublishedFromFactoryLocks(slugs);
    lifecycleBySlug = await getDemoLifecycleBySlugs(slugs);
  }

  const smsStates = isDatabaseConfigured()
    ? await listSmsLeadStatesBySlugs(slugs)
    : [];
  const smsBySlug = new Map(smsStates.map((state) => [state.slug, state]));

  const allRows = buildAdminLeadRows(
    leads,
    customerSlugs,
    smsBySlug,
    lifecycleBySlug,
  );

  return filterAdminLeadRows(allRows, filters);
}

async function queryAdminLeadsLegacy(
  query: AdminLeadsQuery,
): Promise<AdminLeadsPageResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, query.pageSize ?? 20));
  const pipeline = query.pipeline ?? "actionable";
  const filters: AdminLeadListFilters = {
    pipeline,
    status: query.status,
    outreach: query.outreach,
  };

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

  const smsStates = isDatabaseConfigured()
    ? await listSmsLeadStatesBySlugs(slugs)
    : [];
  const smsBySlug = new Map(smsStates.map((state) => [state.slug, state]));

  const allRows = buildAdminLeadRows(
    allLeads,
    customerSlugs,
    smsBySlug,
    lifecycleBySlug,
  );

  let filtered = filterAdminLeadRows(allRows, filters);

  if (query.q?.trim()) {
    const needle = query.q.trim().toLowerCase();
    filtered = filtered.filter((row) => {
      const haystack = [
        row.lead.slug,
        row.lead.companyName ?? "",
        row.lead.phone ?? "",
        row.lead.email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }

  const sort = query.sort ?? "company";
  filtered = [...filtered].sort((a, b) => {
    switch (sort) {
      case "demo_age":
        return (b.demoAgeDays ?? -1) - (a.demoAgeDays ?? -1);
      case "views":
        return (b.lifecycle?.viewCount ?? 0) - (a.lifecycle?.viewCount ?? 0);
      case "activity":
        const aTime = new Date(
          a.lifecycle?.lastViewedAt ?? a.lifecycle?.publishedAt ?? "1970",
        ).getTime();
        const bTime = new Date(
          b.lifecycle?.lastViewedAt ?? b.lifecycle?.publishedAt ?? "1970",
        ).getTime();
        return bTime - aTime;
      default:
        return (a.lead.companyName ?? a.lead.slug).localeCompare(
          b.lead.companyName ?? b.lead.slug,
          "sl",
        );
    }
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return { rows, total, page: safePage, pageSize, totalPages };
}

export async function queryAdminLeads(
  query: AdminLeadsQuery,
): Promise<AdminLeadsPageResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, query.pageSize ?? 20));
  const pipeline = query.pipeline ?? "actionable";
  const hasRowFilters = Boolean(query.status?.trim() || query.outreach?.trim());

  if (!isDatabaseConfigured() || hasRowFilters) {
    return queryAdminLeadsLegacy(query);
  }

  const { rows: indexRows, total } = await queryEntityIndex({
    page,
    pageSize,
    pipeline,
    q: query.q,
    sort: query.sort,
  });

  const enriched = await enrichIndexRows(indexRows, {
    pipeline,
    status: query.status,
    outreach: query.outreach,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    rows: enriched,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function searchAdminEntities(
  q: string,
  limit = 15,
): Promise<
  Array<{ slug: string; companyName: string; stage: string; href: string }>
> {
  if (isDatabaseConfigured()) {
    const indexResults = await searchEntityIndex(q, limit);
    if (indexResults.length > 0) {
      return indexResults.map((row) => ({
        slug: row.slug,
        companyName: row.companyName,
        stage: row.unifiedStage,
        href: `/admin/e/${row.slug}`,
      }));
    }
  }

  const result = await queryAdminLeadsLegacy({
    q,
    pipeline: "actionable",
    page: 1,
    pageSize: limit,
    sort: "company",
  });

  const customerResult = await queryAdminLeadsLegacy({
    q,
    pipeline: "customers",
    page: 1,
    pageSize: limit,
    sort: "company",
  });

  const merged = [...result.rows, ...customerResult.rows];
  const seen = new Set<string>();

  return merged
    .filter((row) => {
      if (seen.has(row.lead.slug)) {
        return false;
      }
      seen.add(row.lead.slug);
      return true;
    })
    .slice(0, limit)
    .map((row) => ({
      slug: row.lead.slug,
      companyName: row.lead.companyName ?? row.lead.slug,
      stage: row.displayStatus,
      href: `/admin/e/${row.lead.slug}`,
    }));
}
