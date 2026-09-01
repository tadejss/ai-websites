import { getRevenueAnalytics } from "@/admin/analytics";
import { listRecentAuditLogs } from "@/admin/audit";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
  formatAdminDate,
} from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { RevenueFunnelChart } from "@/components/admin/revenue-charts";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  const [analytics, auditLogs] = await Promise.all([
    getRevenueAnalytics(),
    listRecentAuditLogs(10),
  ]);

  const upsellEntries = Object.entries(analytics.upsellCounts);

  return (
    <div>
      <AdminPageHeader
        title="Revenue & Analytics"
        description="MRR, funnel, SMS metrics from Neon"
      />

      <AdminStatGrid>
        <AdminStatCard
          label="MRR"
          value={`€${analytics.mrrEur.toFixed(0)}`}
          sub={`ARR €${analytics.arrEur.toFixed(0)}`}
        />
        <AdminStatCard
          label="Customers"
          value={String(analytics.customerCount)}
          sub={`${analytics.monthlyCount} mo · ${analytics.yearlyCount} yr`}
        />
        <AdminStatCard
          label="Purchases (7d)"
          value={String(analytics.purchasesThisWeek)}
          sub={`${analytics.purchasesThisMonth} this month`}
        />
        <AdminStatCard
          label="SMS reply rate"
          value={`${analytics.sms.replyRate}%`}
          sub={`${analytics.sms.replied}/${analytics.sms.sent} sent`}
        />
      </AdminStatGrid>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversion funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueFunnelChart funnel={analytics.funnel} />
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Metric label="Published" value={analytics.funnel.published} />
              <Metric label="Viewed" value={analytics.funnel.viewed} />
              <Metric label="Purchased" value={analytics.funnel.purchased} />
              <Metric label="Live" value={analytics.funnel.live} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMS metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Metric label="Sent" value={analytics.sms.sent} />
              <Metric label="Replied" value={analytics.sms.replied} />
              <Metric label="Opted out" value={analytics.sms.optedOut} />
              <Metric label="Reply rate" value={`${analytics.sms.replyRate}%`} />
            </dl>
          </CardContent>
        </Card>
      </div>

      {upsellEntries.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upsell attach</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {upsellEntries.map(([type, count]) => (
                <li key={type} className="flex justify-between">
                  <span className="text-[var(--admin-muted)]">{type}</span>
                  <span className="font-mono">{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Recent admin actions</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No audit log entries yet</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {auditLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-col gap-1 rounded-md border border-[var(--admin-border)] px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2"
                >
                  <span className="font-mono text-xs">{log.action}</span>
                  {log.slug ? (
                    <span className="text-[var(--admin-muted)]">{log.slug}</span>
                  ) : null}
                  <span
                    className={
                      log.result === "ok" ? "text-emerald-400" : "text-red-400"
                    }
                  >
                    {log.result}
                  </span>
                  <span className="text-xs text-[var(--admin-muted)]">
                    {formatAdminDate(log.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-[var(--admin-surface-elevated)] px-3 py-2">
      <dt className="text-xs text-[var(--admin-muted)]">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
