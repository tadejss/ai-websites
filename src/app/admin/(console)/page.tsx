import { getActionQueue } from "@/admin/queue";
import { getFactoryOpsSnapshot } from "@/factory/ops-snapshot";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
} from "@/components/admin/admin-page";
import { ActionQueue } from "@/components/admin/action-queue";
import { RunbookPanel } from "@/components/admin/runbook-panel";

export const dynamic = "force-dynamic";

export default async function AdminCommandCenterPage() {
  const [items, snapshot] = await Promise.all([
    getActionQueue(50),
    getFactoryOpsSnapshot(),
  ]);

  const publishFailedCount = items.filter(
    (item) => item.kind === "publish_failed",
  ).length;

  return (
    <div>
      <AdminPageHeader
        title="Command Center"
        description="Unified action queue — keyboard-first ops"
      />

      {publishFailedCount > 0 ? (
        <div className="mb-4">
          <RunbookPanel kind="publish_failed" />
        </div>
      ) : null}
      {snapshot.worker.circuitOpen ? (
        <div className="mb-4">
          <RunbookPanel kind="circuit_open" />
        </div>
      ) : null}

      <AdminStatGrid>
        <AdminStatCard label="Queue items" value={String(items.length)} />
        <AdminStatCard
          label="Publish failed"
          value={String(publishFailedCount)}
        />
        <AdminStatCard
          label="Onboarding review"
          value={String(
            items.filter((item) => item.kind === "onboarding_review").length,
          )}
        />
        <AdminStatCard
          label="Replenish needed"
          value={String(snapshot.replenish.needed)}
          sub={`${snapshot.replenish.actionable}/${snapshot.replenish.target} backlog`}
        />
      </AdminStatGrid>

      <ActionQueue initialItems={items} />
    </div>
  );
}
