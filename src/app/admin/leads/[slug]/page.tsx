import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadWithCustomerState } from "@/customers/merge";
import { getDemoUrl } from "@/leads/demo-url";
import { resolveLeadEmail } from "@/leads/resolve-email";
import {
  getDueOutreachStep,
  getNextFollowUpAt,
  getOutreachStatusLabel,
  isLeadEligibleForOutreach,
} from "@/outreach/eligibility";
import { getOutreachConfig } from "@/outreach/config";
import { getOnboardingBySlug, getOnboardingUrl } from "@/onboarding/store";
import { onboardingStatusLabel } from "@/onboarding/types";
import { SendOutreachButton } from "./send-outreach-button";
import {
  AdminCopyOnboardingLink,
  AdminPublishLivePlaceholder,
} from "./onboarding-admin";

export const dynamic = "force-dynamic";

function formatDate(value: string | undefined | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("sl-SI");
}

function planLabel(plan: string | null | undefined): string {
  if (plan === "monthly") {
    return "Monthly";
  }
  if (plan === "yearly") {
    return "Yearly";
  }
  return plan ?? "—";
}

function upsellLabel(type: string | null): string {
  switch (type) {
    case "google_business":
      return "Google Business";
    case "seo":
      return "SEO";
    case "professional_email":
      return "Professional Email";
    default:
      return type ?? "—";
  }
}

export default async function AdminLeadDetailPage({
  params,
}: PageProps<"/admin/leads/[slug]">) {
  const { slug } = await params;
  const lead = await getLeadWithCustomerState(slug);

  if (!lead) {
    notFound();
  }

  const config = getOutreachConfig();
  const email = resolveLeadEmail(lead);
  const outreach = lead.outreach;
  const dueStep = getDueOutreachStep(lead);
  const customer = lead.customer;
  const displayStatus = customer ? "CUSTOMER" : (lead.status ?? "LEAD").toUpperCase();
  const onboarding = customer ? await getOnboardingBySlug(slug) : null;
  const onboardingUrl =
    onboarding != null ? getOnboardingUrl(slug, onboarding.accessToken) : null;

  return (
    <div>
      <Link href="/admin/leads" className="text-sm text-blue-700 hover:underline">
        ← Back to leads
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{lead.companyName ?? lead.slug}</h1>
          <p className="mt-1 text-sm text-neutral-600">{lead.industry}</p>
          <p
            className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-semibold tracking-wide ${
              customer
                ? "bg-emerald-100 text-emerald-800"
                : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {displayStatus}
          </p>
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
              <dd>{displayStatus}</dd>
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
        <h2 className="font-medium">Customer / payment</h2>
        {customer ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Status</dt>
              <dd className="font-medium text-emerald-700">CUSTOMER</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Customer</dt>
              <dd className="font-mono text-xs">{customer.stripeCustomerId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Subscription</dt>
              <dd className="font-mono text-xs">
                {customer.stripeSubscriptionId ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Plan</dt>
              <dd>{planLabel(customer.subscriptionPlan)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Purchased at</dt>
              <dd>{formatDate(customer.purchasedAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Purchased upsells</dt>
              <dd className="text-right">
                {lead.purchasedUpsellTypes.length
                  ? lead.purchasedUpsellTypes.map(upsellLabel).join(", ")
                  : "—"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            LEAD — no persistent customer record yet.
          </p>
        )}

        {lead.purchases.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-medium">Purchases</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {lead.purchases.map((purchase) => (
                <li
                  key={purchase.id}
                  className="rounded bg-neutral-50 px-3 py-2"
                >
                  <div className="font-medium">
                    {purchase.purchaseKind === "upsell"
                      ? `Upsell · ${upsellLabel(purchase.upsellType)}`
                      : "Base subscription"}{" "}
                    · {formatDate(purchase.purchasedAt)}
                  </div>
                  <div className="text-xs text-neutral-500">
                    Session {purchase.stripeCheckoutSessionId}
                    {purchase.stripeObjectId
                      ? ` · ${purchase.stripeObjectId}`
                      : ""}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {customer ? (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h2 className="font-medium">Onboarding</h2>
            <AdminPublishLivePlaceholder />
          </div>

          {onboarding?.status === "ready_for_approval" ? (
            <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Stran čaka na potrditev — preglej odgovore in objavi LIVE, ko je
              vse pripravljeno.
            </div>
          ) : null}

          {onboarding ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Status</dt>
                <dd className="font-medium">
                  {onboardingStatusLabel(onboarding.status)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Submitted at</dt>
                <dd>{formatDate(onboarding.submittedAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Contact email</dt>
                <dd>{onboarding.contactEmail ?? onboarding.answers?.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Desired domain</dt>
                <dd>{onboarding.answers?.desiredDomain ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Stripe Customer</dt>
                <dd className="font-mono text-xs">{customer.stripeCustomerId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Subscription</dt>
                <dd className="font-mono text-xs">
                  {customer.stripeSubscriptionId ?? "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-neutral-600">
              Onboarding record not created yet.
            </p>
          )}

          {onboardingUrl ? (
            <div className="mt-4">
              <AdminCopyOnboardingLink url={onboardingUrl} />
            </div>
          ) : null}

          {onboarding?.answers ? (
            <div className="mt-6">
              <h3 className="text-sm font-medium">Questionnaire answers</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {Object.entries(onboarding.answers).map(([key, value]) => (
                  <div key={key} className="rounded bg-neutral-50 px-3 py-2">
                    <dt className="text-xs uppercase tracking-wide text-neutral-500">
                      {key}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap">
                      {Array.isArray(value) ? value.join(", ") : String(value ?? "—")}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {onboarding?.processedPayload ? (
            <div className="mt-6">
              <h3 className="text-sm font-medium">Processed payload (factory-ready)</h3>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-neutral-50 p-3 text-xs">
                {JSON.stringify(onboarding.processedPayload, null, 2)}
              </pre>
            </div>
          ) : null}
        </section>
      ) : null}

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
