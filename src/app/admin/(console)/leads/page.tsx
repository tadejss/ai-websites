import Link from "next/link";
import {
  ADMIN_OUTREACH_FILTERS,
  ADMIN_PIPELINE_VIEWS,
  ADMIN_STATUS_FILTERS,
  isAdminOutreachFilter,
  isAdminStatusFilter,
  resolveAdminPipelineView,
} from "@/admin/leads-filters";
import { queryAdminLeads } from "@/admin/leads-query";
import { listSmsLeadStatesBySlugs } from "@/outreach/sms/store";
import { getQaLatestBySlugs } from "@/qa/store";
import { resolveSavedView, ADMIN_SAVED_VIEWS, savedViewHref } from "@/admin/saved-views";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { adminControlClassName, adminLabelClassName } from "@/components/admin/admin-styles";
import { AdminLeadsTableClient } from "@/components/admin/leads-table-client";
import { Button } from "@/components/admin/ui/button";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    page?: string;
    pipeline?: string;
    status?: string;
    outreach?: string;
    q?: string;
    sort?: string;
    view?: string;
  }>;
};

export default async function AdminLeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const savedView = resolveSavedView(params.view);
  const pipeline = resolveAdminPipelineView(
    savedView?.pipeline ?? params.pipeline,
  );
  const page = Math.max(1, Number(params.page) || 1);
  const q = (savedView?.q ?? params.q?.trim()) || undefined;
  const sort = (
    ["company", "demo_age", "views", "activity"].includes(
      savedView?.sort ?? params.sort ?? "",
    )
      ? (savedView?.sort ?? params.sort)
      : "company"
  ) as "company" | "demo_age" | "views" | "activity";

  const statusFilter = isAdminStatusFilter(savedView?.status ?? params.status)
    ? (savedView?.status ?? params.status)
    : undefined;
  const outreachFilter = isAdminOutreachFilter(
    savedView?.outreach ?? params.outreach,
  )
    ? (savedView?.outreach ?? params.outreach)
    : undefined;

  const result = await queryAdminLeads({
    page,
    pageSize: 20,
    pipeline,
    q,
    sort,
    status: statusFilter,
    outreach: outreachFilter,
  });

  const slugs = result.rows.map((row) => row.lead.slug);
  const [smsStates, qaBySlug] = await Promise.all([
    listSmsLeadStatesBySlugs(slugs),
    getQaLatestBySlugs(slugs),
  ]);
  const smsBySlug = new Map(smsStates.map((state) => [state.slug, state]));

  const tableRows = result.rows.map(
    ({ lead, displayStatus, lifecycle, isNeverViewed, demoAgeDays }) => {
      const sms = smsBySlug.get(lead.slug);
      const qa = qaBySlug.get(lead.slug) ?? null;
      return {
        slug: lead.slug,
        companyName: lead.companyName ?? lead.slug,
        industry: lead.industry ?? null,
        displayStatus: displayStatus || "—",
        phone: lead.phone ?? null,
        smsStatus: sms?.smsStatus ?? "—",
        viewCount:
          lifecycle?.viewCount != null ? String(lifecycle.viewCount) : "—",
        demoAge: demoAgeDays != null ? `${demoAgeDays}d` : "—",
        isNeverViewed,
        qaStatus: qa?.runStatus ?? null,
        qaPolicy: qa?.policyStatus ?? null,
        qaScore: qa?.score ?? null,
      };
    },
  );

  function pageHref(nextPage: number): string {
    const search = new URLSearchParams();
    search.set("page", String(nextPage));
    search.set("pipeline", pipeline);
    if (q) search.set("q", q);
    if (sort) search.set("sort", sort);
    if (statusFilter) search.set("status", statusFilter);
    if (outreachFilter) search.set("outreach", outreachFilter);
    if (params.view) search.set("view", params.view);
    return `/admin/leads?${search.toString()}`;
  }

  return (
    <div>
      <AdminPageHeader
        title="Leads"
        description={`${result.total} total · page ${result.page} of ${result.totalPages}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {ADMIN_SAVED_VIEWS.filter(
          (view) =>
            view.id === "sms-failed-today" || view.id === "onboarding-stuck-3d",
        ).map((view) => (
          <Link
            key={view.id}
            href={savedViewHref(view)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-wide ${
              params.view === view.id
                ? "border-[var(--admin-accent)] bg-[var(--admin-accent)] text-black"
                : "border-white/25 text-[#d0d0d0] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)]"
            }`}
          >
            {view.label}
          </Link>
        ))}
      </div>

      <form
        method="get"
        className="mb-6 grid grid-cols-2 items-end gap-3 rounded-[var(--admin-radius)] border border-white/15 bg-white/[0.03] p-4 md:flex md:flex-wrap"
      >
        <label className="min-w-0 md:min-w-[12rem]">
          <span className={adminLabelClassName}>Pipeline</span>
          <select
            name="pipeline"
            defaultValue={pipeline}
            className={adminControlClassName}
          >
            {ADMIN_PIPELINE_VIEWS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 md:min-w-[10rem]">
          <span className={adminLabelClassName}>Status</span>
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className={adminControlClassName}
          >
            <option value="">All</option>
            {ADMIN_STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 md:min-w-[12rem]">
          <span className={adminLabelClassName}>Outreach</span>
          <select
            name="outreach"
            defaultValue={outreachFilter ?? ""}
            className={adminControlClassName}
          >
            <option value="">All</option>
            {ADMIN_OUTREACH_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 md:min-w-[10rem]">
          <span className={adminLabelClassName}>Sort</span>
          <select
            name="sort"
            defaultValue={sort}
            className={adminControlClassName}
          >
            <option value="company">Company</option>
            <option value="demo_age">Demo age</option>
            <option value="views">Views</option>
            <option value="activity">Last activity</option>
          </select>
        </label>
        <label className="col-span-2 min-w-0 md:min-w-[14rem] md:flex-1">
          <span className={adminLabelClassName}>Search</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="company, slug, phone…"
            className={adminControlClassName}
          />
        </label>
        <div className="col-span-2 flex gap-2 md:col-span-1">
          <Button type="submit" variant="secondary" size="sm">
            Apply
          </Button>
          {q || pipeline !== "actionable" || statusFilter || outreachFilter ? (
            <Link href="/admin/leads">
              <Button type="button" variant="ghost" size="sm">
                Clear
              </Button>
            </Link>
          ) : null}
        </div>
      </form>

      {result.rows.length === 0 ? (
        <p className="rounded-[var(--admin-radius)] border border-white/15 px-4 py-8 text-center text-sm text-[var(--admin-muted)]">
          No leads match the selected filters.
        </p>
      ) : (
        <>
          <LeadsPagination
            page={result.page}
            totalPages={result.totalPages}
            pageHref={pageHref}
            className="mb-3"
          />
          <AdminLeadsTableClient rows={tableRows} />
        </>
      )}

      <LeadsPagination
        page={result.page}
        totalPages={result.totalPages}
        pageHref={pageHref}
        className="mt-4"
      />
    </div>
  );
}

function LeadsPagination({
  page,
  totalPages,
  pageHref,
  className,
}: {
  page: number;
  totalPages: number;
  pageHref: (nextPage: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between text-sm ${className ?? ""}`}>
      {page > 1 ? (
        <Link
          href={pageHref(page - 1)}
          className="text-[var(--admin-accent)] hover:underline"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-[var(--admin-muted)]">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={pageHref(page + 1)}
          className="text-[var(--admin-accent)] hover:underline"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
