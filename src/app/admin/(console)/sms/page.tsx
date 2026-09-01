import { isDatabaseConfigured } from "@/db/client";
import { getSmsConfig, isSmsGatewayConfigured } from "@/outreach/sms/config";
import {
  countByLeadStatus,
  countSentToday,
  listSmsLeadStates,
} from "@/outreach/sms/store";
import { AdminPageHeader, AdminStatCard, AdminStatGrid } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { formatAdminDate } from "@/components/admin/admin-page";

export const dynamic = "force-dynamic";

export default async function AdminSmsPage() {
  const smsConfig = getSmsConfig();
  const smsCounts = isDatabaseConfigured() ? await countByLeadStatus() : {};
  const sentToday = isDatabaseConfigured() ? await countSentToday() : 0;
  const states = isDatabaseConfigured() ? await listSmsLeadStates() : [];
  const recentFailed = states
    .filter((state) => state.smsStatus === "failed")
    .slice(0, 20);

  return (
    <div>
      <AdminPageHeader
        title="SMS command"
        description="Queue depth, daily cap, and failed messages"
      />

      <AdminStatGrid className="lg:grid-cols-5">
        <AdminStatCard label="Queued" value={String(smsCounts.queued ?? 0)} />
        <AdminStatCard label="Sent" value={String(smsCounts.sent ?? 0)} />
        <AdminStatCard label="Failed" value={String(smsCounts.failed ?? 0)} />
        <AdminStatCard
          label="Sent today"
          value={`${sentToday}/${smsConfig.dailyLimit}`}
        />
        <AdminStatCard
          label="Gateway"
          value={isSmsGatewayConfigured() ? "online" : "offline"}
        />
      </AdminStatGrid>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent failures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentFailed.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No failed SMS</p>
          ) : (
            recentFailed.map((state) => (
              <div
                key={state.slug}
                className="flex justify-between rounded border border-[var(--admin-border)] px-3 py-2 text-sm"
              >
                <span className="font-mono">{state.slug}</span>
                <span className="text-xs text-[var(--admin-muted)]">
                  {state.smsLastError ?? state.smsStatus}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
