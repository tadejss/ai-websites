import {
  buildAdminLeadRows,
  filterAdminLeadRows,
  type AdminPipelineView,
} from "@/admin/leads-filters";
import { getCustomerSlugSet } from "@/customers/store";
import { isDatabaseConfigured } from "@/db/client";
import {
  backfillPublishedFromFactoryLocks,
  getDemoLifecycleBySlugs,
} from "@/demo-lifecycle/store";
import { readAllLeads } from "@/leads/store";
import { listSmsLeadStates } from "@/outreach/sms/store";

export type AdminLeadsQuery = {
  page?: number;
  pageSize?: number;
  pipeline?: AdminPipelineView;
  q?: string;
  sort?: "company" | "demo_age" | "views" | "activity";
};

export type AdminLeadsPageResult = {
  rows: ReturnType<typeof buildAdminLeadRows>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function matchesSearch(
  row: ReturnType<typeof buildAdminLeadRows>[number],
  q: string,
): boolean {
  const needle = q.toLowerCase();
  const haystack = [
    row.lead.slug,
    row.lead.companyName ?? "",
    row.lead.phone ?? "",
    row.lead.email ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function sortRows(
  rows: ReturnType<typeof buildAdminLeadRows>,
  sort: AdminLeadsQuery["sort"],
): ReturnType<typeof buildAdminLeadRows> {
  const copy = [...rows];
  switch (sort) {
    case "demo_age":
      return copy.sort(
        (a, b) => (b.demoAgeDays ?? -1) - (a.demoAgeDays ?? -1),
      );
    case "views":
      return copy.sort(
        (a, b) =>
          (b.lifecycle?.viewCount ?? 0) - (a.lifecycle?.viewCount ?? 0),
      );
    case "activity":
      return copy.sort((a, b) => {
        const aTime = new Date(
          a.lifecycle?.lastViewedAt ??
            a.lifecycle?.publishedAt ??
            "1970-01-01",
        ).getTime();
        const bTime = new Date(
          b.lifecycle?.lastViewedAt ??
            b.lifecycle?.publishedAt ??
            "1970-01-01",
        ).getTime();
        return bTime - aTime;
      });
    case "company":
    default:
      return copy.sort((a, b) =>
        (a.lead.companyName ?? a.lead.slug).localeCompare(
          b.lead.companyName ?? b.lead.slug,
          "sl",
        ),
      );
  }
}

export async function queryAdminLeads(
  query: AdminLeadsQuery,
): Promise<AdminLeadsPageResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, query.pageSize ?? 50));
  const pipeline = query.pipeline ?? "actionable";

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

  let filtered = filterAdminLeadRows(allRows, { pipeline });

  if (query.q?.trim()) {
    filtered = filtered.filter((row) => matchesSearch(row, query.q!.trim()));
  }

  filtered = sortRows(filtered, query.sort);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return { rows, total, page: safePage, pageSize, totalPages };
}

export async function searchAdminEntities(
  q: string,
  limit = 15,
): Promise<
  Array<{ slug: string; companyName: string; stage: string; href: string }>
> {
  const result = await queryAdminLeads({
    q,
    pipeline: "actionable",
    page: 1,
    pageSize: limit,
    sort: "company",
  });

  const customerResult = await queryAdminLeads({
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
