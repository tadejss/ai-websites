import Link from "next/link";
import { notFound } from "next/navigation";
import { readFileSync } from "node:fs";
import { loadAdminEntity, getEntityDemoUrl } from "@/admin/load-entity";
import { getQueueNeighbors } from "@/admin/queue";
import { unifiedStageLabel } from "@/admin/entity";
import { getOnboardingUrl } from "@/onboarding/store";
import { listOnboardingImages } from "@/onboarding/images";
import { canAdminAttachWebsiteDomain } from "@/onboarding/types";
import { clientSitePath } from "@/leads/client-exists";
import { getFactoryWorkerConfig } from "@/factory/config";
import {
  AdminPageHeader,
  formatAdminDate,
} from "@/components/admin/admin-page";
import { Badge } from "@/components/admin/ui/badge";
import { EntityTimelineV2 } from "@/components/admin/entity-timeline-v2";
import { EntityContextCards } from "@/components/admin/entity-context-cards";
import { OnboardingDiffView } from "@/components/admin/onboarding-diff-view";
import { OnboardingImageGallery } from "@/components/admin/onboarding-gallery";
import { AdminActionDispatcher } from "@/components/admin/admin-action-dispatcher";
import { RunbookPanel } from "@/components/admin/runbook-panel";
import { EntityJourneyActions } from "@/components/admin/entity-journey-actions";

export const dynamic = "force-dynamic";

function readDemoSiteJson(slug: string): Record<string, unknown> | null {
  try {
    const path = clientSitePath(slug);
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default async function AdminEntityJourneyPage({
  params,
}: PageProps<"/admin/e/[slug]">) {
  const { slug } = await params;
  const entity = await loadAdminEntity(slug);

  if (!entity) {
    notFound();
  }

  const [neighbors, factoryConfig] = await Promise.all([
    getQueueNeighbors(slug),
    Promise.resolve(getFactoryWorkerConfig()),
  ]);

  const demoUrl = getEntityDemoUrl(entity);
  const onboardingUrl = entity.onboarding
    ? getOnboardingUrl(slug, entity.onboarding.accessToken)
    : null;

  const lastFailed = entity.smsMessages.find(
    (message) => message.status === "failed",
  );

  const demoSite = readDemoSiteJson(slug);
  const processedPayload = entity.onboarding?.processedPayload as
    | Record<string, unknown>
    | null
    | undefined;

  const dispatchWarning = !factoryConfig.dispatchEnabled
    ? "Dispatch is OFF — approve will not trigger publish worker"
    : !factoryConfig.publishEnabled
      ? "Publish is OFF — site will not go live"
      : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin" className="text-xs text-[var(--admin-accent)] hover:underline">
          ← Home {neighbors.index >= 0 ? `${neighbors.index + 1}/${neighbors.total}` : ""}
        </Link>
        <div className="flex gap-2 text-xs">
          {neighbors.prev ? (
            <Link href={`/admin/e/${neighbors.prev}`} className="text-[var(--admin-accent)] hover:underline">
              ← Prev
            </Link>
          ) : null}
          {neighbors.next ? (
            <Link href={`/admin/e/${neighbors.next}`} className="text-[var(--admin-accent)] hover:underline">
              Next →
            </Link>
          ) : null}
        </div>
      </div>

      <AdminPageHeader
        title={entity.companyName}
        description={[entity.industry, entity.slug].filter(Boolean).join(" · ")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{unifiedStageLabel(entity.stage)}</Badge>
            <a
              href={demoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--admin-accent)] hover:underline"
            >
              Open demo ↗
            </a>
          </div>
        }
      />

      {entity.stage === "publish_failed" ? (
        <div className="mb-4">
          <RunbookPanel kind="publish_failed" />
        </div>
      ) : null}

      <EntityJourneyActions
        slug={slug}
        actions={entity.actions}
        onboardingUrl={onboardingUrl}
        demoUrl={demoUrl}
        dispatchWarning={dispatchWarning}
        checklistItems={[
          {
            id: "images",
            label: "Gallery images reviewed",
            checked: listOnboardingImages(entity.onboarding?.answers).length > 0,
          },
          {
            id: "company",
            label: "Company name matches",
            checked: Boolean(entity.onboarding?.answers?.companyName),
          },
          {
            id: "phone",
            label: "Phone present",
            checked: Boolean(entity.phone ?? entity.onboarding?.answers?.phone),
          },
        ]}
        lastFailedMessageId={lastFailed?.messageId}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Timeline
          </h2>
          <EntityTimelineV2 events={entity.timeline} />
        </div>

        <div className="space-y-4 lg:col-span-8">
          <EntityContextCards
            stage={entity.stage}
            cards={[
              {
                id: "grok_qa",
                title: "Grok QA",
                stages: [
                  "generated",
                  "published",
                  "viewed",
                  "purchased",
                  "onboarding_pending",
                  "onboarding_submitted",
                  "ready_for_approval",
                  "approved_for_publish",
                  "publishing",
                  "publish_failed",
                  "live",
                ],
                content: entity.qaLatest ? (
                  <div className="space-y-3 text-sm">
                    <dl className="grid gap-1">
                      <div>
                        Status: {entity.qaLatest.runStatus}
                        {entity.qaLatest.policyStatus
                          ? ` · ${entity.qaLatest.policyStatus}`
                          : ""}
                      </div>
                      <div>
                        Score:{" "}
                        {entity.qaLatest.score != null
                          ? entity.qaLatest.score
                          : "—"}
                      </div>
                      <div>
                        Last run: {formatAdminDate(entity.qaLatest.completedAt ?? entity.qaLatest.createdAt)}
                      </div>
                      <div>Runs: {entity.qaLatest.runCount}</div>
                      <div>
                        Open issues: {entity.qaLatest.openIssueCount}
                        {entity.qaLatest.highestSeverity
                          ? ` · highest ${entity.qaLatest.highestSeverity}`
                          : ""}
                      </div>
                      {entity.qaLatest.model ? (
                        <div>Model: {entity.qaLatest.model}</div>
                      ) : null}
                    </dl>
                    {entity.qaLatest.summary ? (
                      <p className="text-xs text-[var(--admin-muted)]">
                        {entity.qaLatest.summary}
                      </p>
                    ) : null}
                    {entity.qaLatest.issues.length > 0 ? (
                      <div className="space-y-2">
                        {entity.qaLatest.issues.map((issue) => (
                          <div
                            key={issue.id}
                            className="rounded border border-[var(--admin-border)] px-2 py-1 text-xs"
                          >
                            <p className="font-medium">
                              {issue.severity} · {issue.category} · {issue.type}
                            </p>
                            <p>{issue.message}</p>
                            {issue.evidence ? (
                              <p className="text-[var(--admin-muted)]">
                                Evidence: {issue.evidence}
                              </p>
                            ) : null}
                            {issue.expected ? (
                              <p className="text-[var(--admin-muted)]">
                                Expected: {issue.expected}
                              </p>
                            ) : null}
                            {issue.actual ? (
                              <p className="text-[var(--admin-muted)]">
                                Actual: {issue.actual}
                              </p>
                            ) : null}
                            <p className="text-[var(--admin-muted)]">
                              Confidence: {issue.confidence}
                              {issue.recommendedFix
                                ? ` · Fix: ${issue.recommendedFix}`
                                : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <AdminActionDispatcher
                      slug={slug}
                      actions={entity.actions.filter(
                        (action) => action.kind === "run_qa",
                      )}
                      layout="inline"
                    />
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="text-[var(--admin-muted)]">No QA runs yet</p>
                    <AdminActionDispatcher
                      slug={slug}
                      actions={entity.actions.filter(
                        (action) => action.kind === "run_qa",
                      )}
                      layout="inline"
                    />
                  </div>
                ),
              },
              {
                id: "sms",
                title: "SMS",
                stages: [
                  "published",
                  "viewed",
                  "purchased",
                  "onboarding_pending",
                  "onboarding_submitted",
                ],
                content: (
                  <div className="space-y-2 text-sm">
                    <p>Status: {entity.substates.smsStatus ?? "—"}</p>
                    {entity.smsMessages.slice(0, 5).map((msg) => (
                      <div
                        key={msg.messageId}
                        className="rounded border border-[var(--admin-border)] px-2 py-1 text-xs"
                      >
                        {msg.step} · {msg.status} · {formatAdminDate(msg.sentAt ?? msg.createdAt)}
                      </div>
                    ))}
                    {entity.smsInbound.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-xs font-medium">Inbound</p>
                        {entity.smsInbound.map((msg) => (
                          <p key={msg.id} className="text-xs text-[var(--admin-muted)]">
                            {msg.body}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                id: "onboarding",
                title: "Onboarding",
                stages: [
                  "onboarding_submitted",
                  "ready_for_approval",
                  "approved_for_publish",
                  "publishing",
                  "publish_failed",
                  "live",
                ],
                content: entity.onboarding ? (
                  <div className="space-y-3 text-sm">
                    {entity.onboarding.publishError ? (
                      <p className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-400">
                        {entity.onboarding.publishError}
                      </p>
                    ) : null}
                    <OnboardingDiffView
                      demoSite={demoSite}
                      processedPayload={processedPayload ?? null}
                    />
                    <OnboardingImageGallery
                      images={listOnboardingImages(entity.onboarding.answers)}
                    />
                    {canAdminAttachWebsiteDomain(entity.onboarding.status) ? (
                      <p className="pt-1">
                        <Link
                          href={`/admin/domains?slug=${encodeURIComponent(slug)}`}
                          className="text-sm text-[var(--admin-accent)] hover:underline"
                        >
                          Custom URL →
                        </Link>
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--admin-muted)]">No onboarding</p>
                ),
              },
              {
                id: "business_email",
                title: "Business Email",
                stages: [
                  "purchased",
                  "onboarding_pending",
                  "onboarding_submitted",
                  "ready_for_approval",
                  "approved_for_publish",
                  "publishing",
                  "publish_failed",
                  "live",
                ],
                content: entity.emailService ? (
                  <div className="space-y-3 text-sm">
                    <dl className="grid gap-1">
                      <div>
                        Domain: {entity.emailDomain?.domain ?? "—"} (
                        {entity.emailDomain?.status ?? "—"})
                      </div>
                      <div>
                        Mailbox: {entity.emailMailbox?.emailAddress ?? "—"}
                      </div>
                      <div>Provider: {entity.emailService.provider}</div>
                      <div>Status: {entity.emailService.status}</div>
                      <div>
                        Stripe sub:{" "}
                        {entity.emailService.stripeSubscriptionId ?? "—"}
                      </div>
                      <div>
                        Created: {formatAdminDate(entity.emailService.createdAt)}
                      </div>
                    </dl>
                    {entity.emailService.lastError ? (
                      <p className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-400">
                        {entity.emailService.lastError}
                      </p>
                    ) : null}
                    <AdminActionDispatcher
                      slug={slug}
                      actions={entity.actions.filter((action) =>
                        [
                          "activate_domain",
                          "retry_email_provision",
                          "resend_email_credentials",
                        ].includes(action.kind),
                      )}
                      layout="inline"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-[var(--admin-muted)]">
                    No Business Email service
                  </p>
                ),
              },
              {
                id: "customer",
                title: "Customer",
                stages: ["live", "purchased"],
                content: entity.lead.customer ? (
                  <dl className="grid gap-1 text-sm">
                    <div>Plan: {entity.lead.customer.subscriptionPlan ?? "—"}</div>
                    <div>
                      Stripe: {entity.lead.customer.stripeCustomerId ?? "—"}
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-[var(--admin-muted)]">Not a customer</p>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
