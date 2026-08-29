import Link from "next/link";
import {
  ADMIN_OUTREACH_FILTERS,
  ADMIN_STATUS_FILTERS,
  buildAdminLeadRows,
  filterAdminLeadRows,
  isAdminOutreachFilter,
  isAdminStatusFilter,
} from "@/admin/leads-filters";
import { getCustomerSlugSet } from "@/customers/store";
import { getDemoUrl } from "@/leads/demo-url";
import { resolveLeadEmail } from "@/leads/resolve-email";
import { getNextFollowUpAt } from "@/outreach/eligibility";
import { getOutreachConfig } from "@/outreach/config";
import { readAllLeads } from "@/leads/store";

export const dynamic = "force-dynamic";

function formatDate(value: string | undefined): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("sl-SI");
}

type Props = {
  searchParams: Promise<{
    status?: string;
    outreach?: string;
  }>;
};

export default async function AdminLeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const statusFilter = isAdminStatusFilter(params.status)
    ? params.status
    : undefined;
  const outreachFilter = isAdminOutreachFilter(params.outreach)
    ? params.outreach
    : undefined;

  const config = getOutreachConfig();
  const customerSlugs = await getCustomerSlugSet();
  const allRows = buildAdminLeadRows(
    readAllLeads().sort((a, b) =>
      (a.companyName ?? a.slug).localeCompare(b.companyName ?? b.slug, "sl"),
    ),
    customerSlugs,
  );
  const rows = filterAdminLeadRows(allRows, {
    status: statusFilter,
    outreach: outreachFilter,
  });

  const activeFilters = Boolean(statusFilter || outreachFilter);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Outreach mode: {config.dryRun ? "DRY RUN" : "LIVE"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Showing {rows.length} of {allRows.length} leads
          </p>
        </div>
      </div>

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <label className="block text-sm">
          <span className="font-medium text-neutral-700">Status</span>
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className="mt-1 block min-w-[12rem] rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {ADMIN_STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-neutral-700">Outreach</span>
          <select
            name="outreach"
            defaultValue={outreachFilter ?? ""}
            className="mt-1 block min-w-[14rem] rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All outreach</option>
            {ADMIN_OUTREACH_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Filter
          </button>
          {activeFilters ? (
            <Link
              href="/admin/leads"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-600">
          No leads match the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Outreach</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">Next</th>
                <th className="px-4 py-3 font-medium">Count</th>
                <th className="px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ lead, displayStatus, outreachLabel }) => {
                const email = resolveLeadEmail(lead);
                const outreach = lead.outreach;

                return (
                  <tr key={lead.slug} className="border-b border-neutral-100">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/leads/${lead.slug}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {lead.companyName ?? lead.slug}
                      </Link>
                      <div className="text-xs text-neutral-500">{lead.industry}</div>
                    </td>
                    <td className="px-4 py-3">{displayStatus || "—"}</td>
                    <td className="px-4 py-3">{outreachLabel}</td>
                    <td className="px-4 py-3">{email ?? "—"}</td>
                    <td className="px-4 py-3">{formatDate(outreach?.lastSentAt)}</td>
                    <td className="px-4 py-3">
                      {formatDate(getNextFollowUpAt(lead) ?? outreach?.nextFollowUpAt)}
                    </td>
                    <td className="px-4 py-3">{outreach?.emailsSent ?? 0}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-red-600">
                      {outreach?.lastError ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-neutral-500">
        Demo base URL: {getDemoUrl({ slug: "example", url: "/example" }).replace("/example", "")}
      </p>
    </div>
  );
}
