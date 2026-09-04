import { getActionQueue } from "@/admin/queue";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
} from "@/components/admin/admin-page";
import { ActionQueue } from "@/components/admin/action-queue";
import { RunbookPanel } from "@/components/admin/runbook-panel";

export const dynamic = "force-dynamic";

export default async function AdminCommandCenterPage() {
  const items = await getActionQueue(20);

  const publishFailedCount = items.filter(
    (item) => item.kind === "publish_failed",
  ).length;
  const reviewCount = items.filter(
    (item) => item.kind === "onboarding_review",
  ).length;
  const qaFailedCount = items.filter((item) => item.kind === "qa_failed").length;
  const stuckCount = items.filter((item) => item.kind === "stuck_publishing").length;

  return (
    <div>
      <AdminPageHeader
        title="Home"
        description="Items that need action"
      />

      {publishFailedCount > 0 ? (
        <div className="mb-4">
          <RunbookPanel kind="publish_failed" />
        </div>
      ) : null}

      <AdminStatCard
        variant="hero"
        tone="accent"
        label="Needs action"
        value={String(items.length)}
        sub="Open items in the queue below"
        className="mb-4"
      />

      <AdminStatGrid className="lg:grid-cols-2">
        <AdminStatCard
          label="Publish failed"
          value={String(publishFailedCount)}
          href="/admin/factory"
          tone="danger"
        />
        <AdminStatCard
          label="Onboarding review"
          value={String(reviewCount)}
          href="/admin/review"
          tone="warning"
        />
        <AdminStatCard
          label="QA failed"
          value={String(qaFailedCount)}
          href="/admin/factory"
          tone="danger"
        />
        <AdminStatCard
          label="Stuck publishing"
          value={String(stuckCount)}
          href="/admin/factory"
          tone="warning"
        />
      </AdminStatGrid>

      <ActionQueue initialItems={items} />
    </div>
  );
}
