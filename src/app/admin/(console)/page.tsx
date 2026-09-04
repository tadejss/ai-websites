import { getActionQueue } from "@/admin/queue";
import { getAdminHealthPayload } from "@/admin/health";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
} from "@/components/admin/admin-page";
import { AdminHealthStrip } from "@/components/admin/admin-health-strip";
import { ActionQueue } from "@/components/admin/action-queue";
import { RunbookPanel } from "@/components/admin/runbook-panel";

export const dynamic = "force-dynamic";

export default async function AdminCommandCenterPage() {
  const [items, health] = await Promise.all([
    getActionQueue(20),
    getAdminHealthPayload(),
  ]);

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
      />

      <AdminHealthStrip initial={health} />

      {publishFailedCount > 0 ? (
        <div className="mb-4">
          <RunbookPanel kind="publish_failed" />
        </div>
      ) : null}

      <AdminStatCard
        variant="hero"
        tone={items.length > 0 ? "danger" : "accent"}
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
          tone={publishFailedCount > 0 ? "danger" : "accent"}
        />
        <AdminStatCard
          label="Onboarding review"
          value={String(reviewCount)}
          href="/admin/review"
          tone={reviewCount > 0 ? "danger" : "accent"}
        />
        <AdminStatCard
          label="QA failed"
          value={String(qaFailedCount)}
          href="/admin/factory"
          tone={qaFailedCount > 0 ? "danger" : "accent"}
        />
        <AdminStatCard
          label="Stuck publishing"
          value={String(stuckCount)}
          href="/admin/factory"
          tone={stuckCount > 0 ? "danger" : "accent"}
        />
      </AdminStatGrid>

      <ActionQueue initialItems={items} />
    </div>
  );
}
