import Link from "next/link";
import { getDemoUrl } from "@/leads/demo-url";
import { resolveLeadEmail } from "@/leads/resolve-email";
import { getNextFollowUpAt, getOutreachStatusLabel } from "@/outreach/eligibility";
import { getOutreachConfig } from "@/outreach/config";
import { readAllLeads } from "@/leads/store";

export const dynamic = "force-dynamic";

function formatDate(value: string | undefined): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("sl-SI");
}

export default function AdminLeadsPage() {
  const config = getOutreachConfig();
  const leads = readAllLeads().sort((a, b) =>
    (a.companyName ?? a.slug).localeCompare(b.companyName ?? b.slug, "sl"),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Outreach mode: {config.dryRun ? "DRY RUN" : "LIVE"}
          </p>
        </div>
      </div>

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
            {leads.map((lead) => {
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
                  <td className="px-4 py-3">{lead.status ?? "—"}</td>
                  <td className="px-4 py-3">{getOutreachStatusLabel(lead)}</td>
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

      <p className="mt-4 text-xs text-neutral-500">
        Demo base URL: {getDemoUrl({ slug: "example", url: "/example" }).replace("/example", "")}
      </p>
    </div>
  );
}
