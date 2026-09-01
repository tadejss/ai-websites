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
import { resolveLeadEmail } from "@/leads/resolve-email";
import { getOutreachConfig } from "@/outreach/config";
import { getSmsConfig } from "@/outreach/sms/config";
import {
  countByLeadStatus,
  countSentToday,
  listSmsLeadStates,
} from "@/outreach/sms/store";
import { isDatabaseConfigured } from "@/db/client";
import { resolveSavedView, ADMIN_SAVED_VIEWS, savedViewHref } from "@/admin/saved-views";
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
    pageSize: 50,
    pipeline,
    q,
    sort,
    status: statusFilter,
    outreach: outreachFilter,
  });

  const config = getOutreachConfig();
  const smsStates = isDatabaseConfigured() ? await listSmsLeadStates() : [];
  const smsBySlug = new Map(smsStates.map((state) => [state.slug, state]));
  const smsConfig = getSmsConfig();
  const smsCounts = isDatabaseConfigured() ? await countByLeadStatus() : {};
  const sentToday = isDatabaseConfigured() ? await countSentToday() : 0;

  const tableRows = result.rows.map(
    ({ lead, displayStatus, lifecycle, isNeverViewed, demoAgeDays }) => {
      const sms = smsBySlug.get(lead.slug);
      return {
        slug: lead.slug,
        companyName: lead.companyName ?? lead.slug,
        industry: lead.industry ?? null,
        displayStatus: displayStatus || "—",
        phone: lead.phone ?? null,
        smsStatus: sms?.smsStatus ?? "—",
        smsSentAt: sms?.smsSentAt ?? null,
        smsError: sms?.smsLastError ?? null,
        viewCount:
          lifecycle?.viewCount != null ? String(lifecycle.viewCount) : "—",
        firstView: formatAdminDate(lifecycle?.firstViewedAt),
        lastView: formatAdminDate(lifecycle?.lastViewedAt),
        demoAge: demoAgeDays != null ? `${demoAgeDays}d` : "—",
        email: resolveLeadEmail(lead) ?? null,
        isNeverViewed,
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
        description={`${result.total} total · page ${result.page}/${result.totalPages} · email ${config.dryRun ? "DRY RUN" : "LIVE"}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {ADMIN_SAVED_VIEWS.map((view) => (
          <Link
            key={view.id}
            href={savedViewHref(view)}
            className={`rounded-md border px-2 py-1 text-xs ${
              params.view === view.id
                ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-foreground)]"
            }`}
          >
            {view.label}
          </Link>
        ))}
      </div>

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
          <span className="text-xs text-[var(--admin-muted)]">Status</span>
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className="mt-1 block min-w-[10rem] rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {ADMIN_STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs text-[var(--admin-muted)]">Outreach</span>
          <select
            name="outreach"
            defaultValue={outreachFilter ?? ""}
            className="mt-1 block min-w-[12rem] rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {ADMIN_OUTREACH_FILTERS.map((option) => (
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
        {q || pipeline !== "actionable" || statusFilter || outreachFilter ? (
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
            <Link
              href={pageHref(result.page - 1)}
              className="text-cyan-400 hover:underline"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[var(--admin-muted)]">
            Page {result.page} of {result.totalPages}
          </span>
          {result.page < result.totalPages ? (
            <Link
              href={pageHref(result.page + 1)}
              className="text-cyan-400 hover:underline"
            >
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
