import { getRevenueAnalytics } from "@/admin/analytics";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
} from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { RevenueMonthlyChart } from "@/components/admin/revenue-charts";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  const analytics = await getRevenueAnalytics();
  const upsellEntries = Object.entries(analytics.upsellCounts);

  return (
    <div>
      <AdminPageHeader
        title="Revenue & Analytics"
        description="MRR, customers, and monthly earnings"
      />

      <AdminStatCard
        variant="hero"
        tone="accent"
        label="MRR"
        value={`€${analytics.mrrEur.toFixed(0)}`}
        sub={`ARR €${analytics.arrEur.toFixed(0)}`}
        className="mb-4"
      />

      <AdminStatGrid className="lg:grid-cols-3">
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
            <CardTitle>Customers per month</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueMonthlyChart
              data={analytics.customersPerMonth}
              valueLabel="Customers"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings per month</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueMonthlyChart
              data={analytics.earningsPerMonth}
              valueLabel="€"
            />
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
    </div>
  );
}
