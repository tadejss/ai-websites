import Link from "next/link";
import {
  ADMIN_PIPELINE_VIEWS,
  isAdminOutreachFilter,
  isAdminStatusFilter,
  resolveAdminPipelineView,
} from "@/admin/leads-filters";
import { queryAdminLeads } from "@/admin/leads-query";
import { resolveLeadEmail } from "@/leads/resolve-email";
import { getOutreachConfig } from "@/outreach/config";
import { countByLeadStatus, countSentToday } from "@/outreach/sms/store";
import { getSmsConfig } from "@/outreach/sms/config";
import { isDatabaseConfigured } from "@/db/client";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
  formatAdminDate,
} from "@/components/admin/admin-page";
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
  }>;
};

export default async function AdminLeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const pipeline = resolveAdminPipelineView(params.pipeline);
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() || undefined;
  const sort = (
    ["company", "demo_age", "views", "activity"].includes(params.sort ?? "")
      ? params.sort
      : "company"
  ) as "company" | "demo_age" | "views" | "activity";

  const result = await queryAdminLeads({
    page,
    pageSize: 50,
    pipeline,
    q,
    sort,
  });

  const config = getOutreachConfig();
  const smsConfig = getSmsConfig();
  const smsCounts = isDatabaseConfigured() ? await countByLeadStatus() : {};
  const sentToday = isDatabaseConfigured() ? await countSentToday() : 0;

  const tableRows = result.rows.map(({ lead, displayStatus, lifecycle, isNeverViewed, demoAgeDays }) => ({
    slug: lead.slug,
    companyName: lead.companyName ?? lead.slug,
    industry: lead.industry ?? null,
    displayStatus: displayStatus || "—",
    phone: lead.phone ?? null,
    smsStatus: "—",
    smsSentAt: null as string | null,
    smsError: null as string | null,
    viewCount: lifecycle?.viewCount != null ? String(lifecycle.viewCount) : "—",
    firstView: formatAdminDate(lifecycle?.firstViewedAt),
    lastView: formatAdminDate(lifecycle?.lastViewedAt),
    demoAge: demoAgeDays != null ? `${demoAgeDays}d` : "—",
    email: resolveLeadEmail(lead) ?? null,
    isNeverViewed,
  }));

  const statusFilter = isAdminStatusFilter(params.status)
    ? params.status
    : undefined;
  const outreachFilter = isAdminOutreachFilter(params.outreach)
    ? params.outreach
    : undefined;

  function pageHref(nextPage: number): string {
    const search = new URLSearchParams();
    search.set("page", String(nextPage));
    search.set("pipeline", pipeline);
    if (q) search.set("q", q);
    if (sort) search.set("sort", sort);
    if (statusFilter) search.set("status", statusFilter);
    if (outreachFilter) search.set("outreach", outreachFilter);
    return `/admin/leads?${search.toString()}`;
  }

  return (
    <div>
      <AdminPageHeader
        title="Leads"
        description={`${result.total} total · page ${result.page}/${result.totalPages} · email ${config.dryRun ? "DRY RUN" : "LIVE"}`}
      />

      <AdminStatGrid className="lg:grid-cols-6">
        <AdminStatCard label="Showing" value={String(result.rows.length)} />
        <AdminStatCard label="Total" value={String(result.total)} />
        <AdminStatCard label="Queued" value={String(smsCounts.queued ?? 0)} />
        <AdminStatCard label="Sent" value={String(smsCounts.sent ?? 0)} />
        <AdminStatCard label="Failed" value={String(smsCounts.failed ?? 0)} />
        <AdminStatCard
          label="Sent today"
          value={`${sentToday}/${smsConfig.dailyLimit}`}
        />
      </AdminStatGrid>

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4"
      >
        <label className="block text-sm">
          <span className="text-xs text-[var(--admin-muted)]">Pipeline</span>
          <select
            name="pipeline"
            defaultValue={pipeline}
            className="mt-1 block min-w-[12rem] rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2 text-sm text-[var(--admin-foreground)]"
          >
            {ADMIN_PIPELINE_VIEWS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs text-[var(--admin-muted)]">Search</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="company, slug, phone…"
            className="mt-1 block min-w-[14rem] rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2 text-sm text-[var(--admin-foreground)]"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs text-[var(--admin-muted)]">Sort</span>
          <select
            name="sort"
            defaultValue={sort}
            className="mt-1 block min-w-[10rem] rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2 text-sm"
          >
            <option value="company">Company</option>
            <option value="demo_age">Demo age</option>
            <option value="views">Views</option>
            <option value="activity">Last activity</option>
          </select>
        </label>
        <Button type="submit" variant="secondary" size="sm">
          Apply
        </Button>
        {q || pipeline !== "actionable" ? (
          <Link href="/admin/leads">
            <Button type="button" variant="ghost" size="sm">
              Clear
            </Button>
          </Link>
        ) : null}
      </form>

      {result.rows.length === 0 ? (
        <p className="rounded-lg border border-[var(--admin-border)] px-4 py-8 text-center text-sm text-[var(--admin-muted)]">
          No leads match the selected filters.
        </p>
      ) : (
        <AdminLeadsTableClient rows={tableRows} />
      )}

      {result.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          {result.page > 1 ? (
            <Link href={pageHref(result.page - 1)} className="text-cyan-400 hover:underline">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[var(--admin-muted)]">
            Page {result.page} of {result.totalPages}
          </span>
          {result.page < result.totalPages ? (
            <Link href={pageHref(result.page + 1)} className="text-cyan-400 hover:underline">
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}
