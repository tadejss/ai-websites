import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAdminEntity, getEntityDemoUrl } from "@/admin/load-entity";
import { unifiedStageLabel } from "@/admin/entity";
import { onboardingStatusLabel } from "@/onboarding/types";
import { lifecycleStatusLabel } from "@/demo-lifecycle/types";
import { listOnboardingImages } from "@/onboarding/images";
import {
  AdminApproveButton,
  AdminCopyLinkButton,
  AdminQueueSmsButton,
  AdminRetryPublishButton,
  AdminRetrySmsButton,
} from "@/components/admin/admin-actions";
import { AdminPageHeader, formatAdminDate } from "@/components/admin/admin-page";
import { Badge } from "@/components/admin/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { evaluateSmsEligibility } from "@/outreach/sms/eligibility";
import { resolveDueSmsStep } from "@/outreach/sms/enqueue-batch";
import { hasActiveOrSentStep } from "@/outreach/sms/store";
import { isDatabaseConfigured } from "@/db/client";
import { isCustomer } from "@/customers/store";
import {
  canAdminApproveOnboarding,
  canRetryCustomerPublish,
} from "@/onboarding/types";
import { getOnboardingUrl } from "@/onboarding/store";
import { OnboardingImageGallery } from "@/app/admin/(console)/leads/[slug]/onboarding-gallery";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminEntityJourneyPage({
  params,
}: PageProps<"/admin/e/[slug]">) {
  const { slug } = await params;
  const entity = await loadAdminEntity(slug);

  if (!entity) {
    notFound();
  }

  const demoUrl = getEntityDemoUrl(entity);
  const onboardingUrl = entity.onboarding
    ? getOnboardingUrl(slug, entity.onboarding.accessToken)
    : null;

  const smsDueStep =
    isDatabaseConfigured()
      ? await resolveDueSmsStep(slug, entity.lead.status)
      : null;
  const smsAlready = smsDueStep
    ? await hasActiveOrSentStep(slug, smsDueStep)
    : false;
  const isCustomerLead =
    entity.substates.isCustomer || (await isCustomer(slug));
  const smsEligibility = evaluateSmsEligibility({
    lead: entity.lead,
    isCustomer: isCustomerLead,
    state: entity.smsState,
    step: smsDueStep ?? "initial",
    alreadySentForStep: smsAlready,
  });
  const lastFailed = entity.smsMessages.find(
    (message) => message.status === "failed",
  );

  const showOnboarding =
    entity.onboarding &&
    (entity.substates.isCustomer ||
      ["onboarding_submitted", "ready_for_approval", "approved_for_publish", "publishing", "publish_failed", "live"].includes(
        entity.stage,
      ));

  return (
    <div className="pb-24 md:pb-0">
      <Link
        href="/admin"
        className="text-xs text-cyan-400 hover:underline"
      >
        ← Inbox
      </Link>

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
              className="text-xs text-cyan-400 hover:underline"
            >
              Open demo ↗
            </a>
          </div>
        }
      />

      <div
        className={cn(
          "z-20 mb-6 flex flex-wrap gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3",
          "max-md:fixed max-md:inset-x-0 max-md:bottom-[calc(4rem+env(safe-area-inset-bottom))] max-md:mb-0 max-md:rounded-none max-md:border-x-0 max-md:border-b-0 max-md:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]",
          "max-md:flex max-md:flex-wrap max-md:[&_button]:min-h-[44px] max-md:[&_button]:flex-1 max-md:[&_button]:min-w-[calc(50%-0.25rem)]",
          "md:sticky md:top-0",
        )}
      >
        <AdminQueueSmsButton
          slug={slug}
          dueStep={smsDueStep}
          canQueue={smsEligibility.ok}
          reason={smsEligibility.ok ? null : smsEligibility.reason}
        />
        <AdminRetrySmsButton
          slug={slug}
          dueStep={smsDueStep}
          canRetry={Boolean(lastFailed)}
          lastFailedMessageId={lastFailed?.messageId}
        />
        {entity.onboarding ? (
          <>
            <AdminApproveButton
              slug={slug}
              canApprove={canAdminApproveOnboarding(entity.onboarding.status)}
            />
            <AdminRetryPublishButton
              slug={slug}
              canRetry={canRetryCustomerPublish(entity.onboarding.status)}
            />
            {onboardingUrl ? (
              <AdminCopyLinkButton url={onboardingUrl} label="Copy onboarding" />
            ) : null}
          </>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {entity.timeline.length === 0 ? (
                <p className="text-sm text-[var(--admin-muted)]">No events yet</p>
              ) : (
                <ol className="relative space-y-4 border-l border-[var(--admin-border)] pl-4">
                  {entity.timeline.map((event) => (
                    <li key={event.id} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-cyan-500" />
                      <div className="text-sm font-medium">{event.label}</div>
                      <div className="text-xs text-[var(--admin-muted)]">
                        {formatAdminDate(event.at)}
                      </div>
                      {event.detail ? (
                        <div className="mt-1 text-xs text-[var(--admin-muted)]">
                          {event.detail}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Substates</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <Stat label="Lead" value={entity.substates.leadStatus} />
                <Stat label="SMS" value={entity.substates.smsStatus ?? "—"} />
                <Stat
                  label="Lifecycle"
                  value={
                    entity.demoLifecycle
                      ? lifecycleStatusLabel(entity.demoLifecycle.lifecycleStatus)
                      : "—"
                  }
                />
                <Stat
                  label="Onboarding"
                  value={
                    entity.onboarding
                      ? onboardingStatusLabel(entity.onboarding.status)
                      : "—"
                  }
                />
              </dl>
            </CardContent>
          </Card>

          {entity.demoLifecycle ? (
            <Card>
              <CardHeader>
                <CardTitle>Demo lifecycle</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <Stat label="Views" value={String(entity.demoLifecycle.viewCount)} />
                  <Stat
                    label="Published"
                    value={formatAdminDate(entity.demoLifecycle.publishedAt)}
                  />
                  <Stat
                    label="First view"
                    value={formatAdminDate(entity.demoLifecycle.firstViewedAt)}
                  />
                  <Stat
                    label="Last view"
                    value={formatAdminDate(entity.demoLifecycle.lastViewedAt)}
                  />
                </dl>
              </CardContent>
            </Card>
          ) : null}

          {entity.smsMessages.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>SMS history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {entity.smsMessages.map((message) => (
                  <div
                    key={message.messageId}
                    className="rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm"
                  >
                    <div className="font-medium">
                      {message.step} · {message.status}
                    </div>
                    <div className="mt-1 text-xs text-[var(--admin-muted)]">
                      {formatAdminDate(message.sentAt ?? message.createdAt)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {showOnboarding && entity.onboarding ? (
            <Card>
              <CardHeader>
                <CardTitle>Onboarding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {entity.onboarding.publishError ? (
                  <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {entity.onboarding.publishError}
                  </p>
                ) : null}
                <dl className="grid gap-2 text-sm">
                  <Stat
                    label="Company"
                    value={entity.onboarding.answers?.companyName ?? "—"}
                  />
                  <Stat
                    label="Email"
                    value={
                      entity.onboarding.contactEmail ??
                      entity.onboarding.answers?.email ??
                      "—"
                    }
                  />
                  <Stat
                    label="Submitted"
                    value={formatAdminDate(entity.onboarding.submittedAt)}
                  />
                </dl>
                <OnboardingImageGallery
                  images={listOnboardingImages(entity.onboarding.answers)}
                />
              </CardContent>
            </Card>
          ) : null}

          {entity.lead.customer ? (
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <Stat
                    label="Plan"
                    value={entity.lead.customer.subscriptionPlan ?? "—"}
                  />
                  <Stat
                    label="Purchased"
                    value={formatAdminDate(entity.lead.customer.purchasedAt)}
                  />
                  <Stat
                    label="Stripe"
                    value={entity.lead.customer.stripeCustomerId}
                  />
                </dl>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-md bg-[var(--admin-surface-elevated)] px-3 py-2">
      <dt className="text-[var(--admin-muted)]">{label}</dt>
      <dd className="text-right font-mono text-xs">{value}</dd>
    </div>
  );
}
