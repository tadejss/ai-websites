import { getAdminInboxData } from "@/admin/inbox";
import { getFactoryOpsSnapshot } from "@/factory/ops-snapshot";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
} from "@/components/admin/admin-page";
import { InboxColumn } from "@/components/admin/inbox-column";

export const dynamic = "force-dynamic";

export default async function AdminCommandCenterPage() {
  const [inbox, snapshot] = await Promise.all([
    getAdminInboxData(),
    getFactoryOpsSnapshot(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Command Center"
        description="What needs action today"
      />

      <AdminStatGrid>
        <AdminStatCard
          label="Onboarding review"
          value={String(inbox.counts.onboardingReview)}
        />
        <AdminStatCard
          label="Publish failed"
          value={String(inbox.counts.publishFailed)}
        />
        <AdminStatCard
          label="SMS actionable"
          value={String(inbox.counts.smsActionable)}
        />
        <AdminStatCard
          label="Replenish needed"
          value={String(snapshot.replenish.needed)}
          sub={`${snapshot.replenish.actionable}/${snapshot.replenish.target} backlog`}
        />
      </AdminStatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <InboxColumn
          title="Onboarding review"
          count={inbox.counts.onboardingReview}
          items={inbox.onboardingReview}
          emptyMessage="No onboarding waiting for review"
        />
        <InboxColumn
          title="Publish failed"
          count={inbox.counts.publishFailed}
          items={inbox.publishFailed}
          emptyMessage="No failed publishes"
        />
        <InboxColumn
          title="SMS actionable"
          count={inbox.counts.smsActionable}
          items={inbox.smsActionable}
          emptyMessage="No actionable SMS leads"
        />
      </div>
    </div>
  );
}
