import Link from "next/link";
import {
  ADMIN_OUTREACH_FILTERS,
  ADMIN_PIPELINE_VIEWS,
  ADMIN_STATUS_FILTERS,
  buildAdminLeadRows,
  filterAdminLeadRows,
  isAdminOutreachFilter,
  isAdminStatusFilter,
  resolveAdminPipelineView,
} from "@/admin/leads-filters";
import { resolveLeadEmail } from "@/leads/resolve-email";
import { getOutreachConfig } from "@/outreach/config";
import { readAllLeads } from "@/leads/store";
import { getDemoUrl } from "@/leads/demo-url";
import { isDatabaseConfigured } from "@/db/client";
import {
  countByLeadStatus,
  countSentToday,
  listSmsLeadStates,
} from "@/outreach/sms/store";
import { getSmsConfig } from "@/outreach/sms/config";
import { isSlovenianMobilePhone } from "@/outreach/sms/phone";
import { getCustomerSlugSet } from "@/customers/store";

export const dynamic = "force-dynamic";

function formatDate(value: string | undefined | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("sl-SI");
}

type Props = {
  searchParams: Promise<{
    status?: string;
    outreach?: string;
    pipeline?: string;
  }>;
};

export default async function AdminLeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const pipeline = resolveAdminPipelineView(params.pipeline);
  const statusFilter = isAdminStatusFilter(params.status)
    ? params.status
    : undefined;
  const outreachFilter = isAdminOutreachFilter(params.outreach)
    ? params.outreach
    : undefined;

  const config = getOutreachConfig();
  const smsConfig = getSmsConfig();
  const customerSlugs = await getCustomerSlugSet();
  const allLeads = readAllLeads().sort((a, b) =>
    (a.companyName ?? a.slug).localeCompare(b.companyName ?? b.slug, "sl"),
  );
  const smsStates = isDatabaseConfigured() ? await listSmsLeadStates() : [];
  const smsBySlug = new Map(smsStates.map((state) => [state.slug, state]));
  const allRows = buildAdminLeadRows(allLeads, customerSlugs, smsBySlug);
  const rows = filterAdminLeadRows(allRows, {
    pipeline,
    status: statusFilter,
    outreach: outreachFilter,
  });

  const activeFilters = Boolean(
    statusFilter || outreachFilter || pipeline !== "actionable",
  );
  const smsCounts = isDatabaseConfigured() ? await countByLeadStatus() : {};
  const sentToday = isDatabaseConfigured() ? await countSentToday() : 0;
  const withMobile = allLeads.filter((lead) =>
    isSlovenianMobilePhone(lead.phone),
  ).length;
  const actionableCount = allRows.filter((row) => row.isActionableSms).length;
  const excludedCount = allRows.filter(
    (row) => !row.isCustomer && !row.isActionableSms,
  ).length;
  const customerCount = allRows.filter((row) => row.isCustomer).length;
  const leadTarget = smsConfig.leadTarget;
  const replenishNeeded = Math.max(0, leadTarget - actionableCount);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="mt-1 text-sm text-neutral-600">
            SMS sales pipeline · Email not required
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Showing {rows.length} · Actionable {actionableCount} of{" "}
            {allRows.length} total · Email mode:{" "}
            {config.dryRun ? "DRY RUN" : "LIVE"}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Actionable", String(actionableCount)],
          ["Target", String(leadTarget)],
          ["Replenishment needed", String(replenishNeeded)],
          ["With mobile", String(withMobile)],
          ["Excluded", String(excludedCount)],
          ["Customers", String(customerCount)],
          ["Queued", String(smsCounts.queued ?? 0)],
          ["Sent", String(smsCounts.sent ?? 0)],
          ["Failed", String(smsCounts.failed ?? 0)],
          ["Replied", String(smsCounts.replied ?? 0)],
          ["Opted out", String(smsCounts.opted_out ?? 0)],
          ["Sent today", `${sentToday} / ${smsConfig.dailyLimit}`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-3"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              {label}
            </div>
            <div className="mt-1 text-lg font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <label className="block text-sm">
          <span className="font-medium text-neutral-700">Pipeline</span>
          <select
            name="pipeline"
            defaultValue={pipeline}
            className="mt-1 block min-w-[14rem] rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            {ADMIN_PIPELINE_VIEWS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">SMS</th>
                <th className="px-4 py-3 font-medium">SMS sent</th>
                <th className="px-4 py-3 font-medium">SMS error</th>
                <th className="px-4 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ lead, displayStatus }) => {
                const email = resolveLeadEmail(lead);
                const sms = smsBySlug.get(lead.slug);

                return (
                  <tr key={lead.slug} className="border-b border-neutral-100">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/leads/${lead.slug}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {lead.companyName ?? lead.slug}
                      </Link>
                      <div className="text-xs text-neutral-500">
                        {lead.industry}
                      </div>
                    </td>
                    <td className="px-4 py-3">{displayStatus || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {lead.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 uppercase">
                      {sms?.smsStatus ?? "—"}
                    </td>
                    <td className="px-4 py-3">{formatDate(sms?.smsSentAt)}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-red-600">
                      {sms?.smsLastError ?? "—"}
                    </td>
                    <td className="px-4 py-3">{email ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-neutral-500">
        Demo base URL:{" "}
        {getDemoUrl({ slug: "example", url: "/example" }).replace(
          "/example",
          "",
        )}
      </p>
    </div>
  );
}
