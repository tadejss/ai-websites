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

  return (
    <div>
      <AdminPageHeader
        title="Inbox"
        description="Items that need action"
      />

      {publishFailedCount > 0 ? (
        <div className="mb-4">
          <RunbookPanel kind="publish_failed" />
        </div>
      ) : null}

      <AdminStatGrid>
        <AdminStatCard label="Needs action" value={String(items.length)} />
        <AdminStatCard label="Publish failed" value={String(publishFailedCount)} />
        <AdminStatCard label="Onboarding review" value={String(reviewCount)} />
        <AdminStatCard label="QA failed" value={String(qaFailedCount)} />
      </AdminStatGrid>

      <ActionQueue initialItems={items} />
    </div>
  );
}
