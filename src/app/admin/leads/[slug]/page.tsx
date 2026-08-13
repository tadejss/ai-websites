import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoUrl } from "@/leads/demo-url";
import { resolveLeadEmail } from "@/leads/resolve-email";
import { readLead } from "@/leads/store";
import {
  getDueOutreachStep,
  getNextFollowUpAt,
  getOutreachStatusLabel,
  isLeadEligibleForOutreach,
} from "@/outreach/eligibility";
import { getOutreachConfig } from "@/outreach/config";
import { SendOutreachButton } from "./send-outreach-button";

export const dynamic = "force-dynamic";

function formatDate(value: string | undefined): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("sl-SI");
}

export default async function AdminLeadDetailPage({
  params,
}: PageProps<"/admin/leads/[slug]">) {
  const { slug } = await params;
  const lead = readLead(slug);

  if (!lead) {
    notFound();
  }

  const config = getOutreachConfig();
  const email = resolveLeadEmail(lead);
  const outreach = lead.outreach;
  const dueStep = getDueOutreachStep(lead);

  return (
    <div>
      <Link href="/admin/leads" className="text-sm text-blue-700 hover:underline">
        ← Back to leads
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{lead.companyName ?? lead.slug}</h1>
          <p className="mt-1 text-sm text-neutral-600">{lead.industry}</p>
        </div>

        <SendOutreachButton
          slug={lead.slug}
          dueStep={dueStep}
          eligible={isLeadEligibleForOutreach(lead)}
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-medium">Lead</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Status</dt>
              <dd>{lead.status ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Phone</dt>
              <dd>{lead.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Address</dt>
              <dd className="text-right">{lead.address ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Existing website</dt>
              <dd className="text-right">{lead.existingWebsite || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Demo</dt>
              <dd>
                <a
                  href={getDemoUrl(lead)}
                  className="text-blue-700 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {getDemoUrl(lead)}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-medium">Outreach</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Mode</dt>
              <dd>{config.dryRun ? "DRY RUN" : "LIVE"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Outreach status</dt>
              <dd>{getOutreachStatusLabel(lead)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Email</dt>
              <dd>{email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Due step</dt>
              <dd>{dueStep ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Emails sent</dt>
              <dd>{outreach?.emailsSent ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Last sent</dt>
              <dd>{formatDate(outreach?.lastSentAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Next follow-up</dt>
              <dd>
                {formatDate(getNextFollowUpAt(lead) ?? outreach?.nextFollowUpAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Delivery</dt>
              <dd>{outreach?.deliveryStatus ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Last error</dt>
              <dd className="text-right text-red-600">{outreach?.lastError ?? "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-medium">Outreach timeline</h2>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div>
            <dt className="text-neutral-500">Initial</dt>
            <dd>{formatDate(outreach?.initialSentAt)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Follow-up #1</dt>
            <dd>{formatDate(outreach?.followup1SentAt)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Follow-up #2</dt>
            <dd>{formatDate(outreach?.followup2SentAt)}</dd>
          </div>
        </dl>

        {lead.contactHistory?.length ? (
          <div className="mt-6">
            <h3 className="text-sm font-medium">Contact history</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {lead.contactHistory.map((entry, index) => (
                <li key={`${entry.sentAt}-${index}`} className="rounded bg-neutral-50 px-3 py-2">
                  <div className="font-medium">
                    {entry.step} · {formatDate(entry.sentAt)}
                    {entry.dryRun ? " (dry run)" : ""}
                  </div>
                  <div className="text-neutral-600">{entry.subject}</div>
                  {entry.messageId ? (
                    <div className="text-xs text-neutral-500">{entry.messageId}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
