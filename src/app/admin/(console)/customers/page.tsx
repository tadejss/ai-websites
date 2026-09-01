import { getRevenueAnalytics } from "@/admin/analytics";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
} from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const analytics = await getRevenueAnalytics();

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="MRR drill-down and plan split (read-only)"
      />

      <AdminStatGrid className="lg:grid-cols-4">
        <AdminStatCard label="Customers" value={String(analytics.customerCount)} />
        <AdminStatCard label="MRR" value={`€${analytics.mrrEur.toFixed(0)}`} />
        <AdminStatCard label="Monthly" value={String(analytics.monthlyCount)} />
        <AdminStatCard label="Yearly" value={String(analytics.yearlyCount)} />
      </AdminStatGrid>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Upsell attach</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(analytics.upsellCounts).length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No upsells</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {Object.entries(analytics.upsellCounts).map(([key, count]) => (
                <li key={key} className="flex justify-between">
                  <span>{key}</span>
                  <span className="font-mono">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
