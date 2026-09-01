import { listRecentAuditLogs } from "@/admin/audit";
import { listSystemEvents } from "@/admin/system-events";
import {
  AdminPageHeader,
  formatAdminDate,
} from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const [audit, system] = await Promise.all([
    listRecentAuditLogs(50),
    listSystemEvents(50),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Activity"
        description="Audit log and system events"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admin audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {audit.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">No audit entries</p>
            ) : (
              audit.map((row) => (
                <div
                  key={row.id}
                  className="rounded border border-[var(--admin-border)] px-3 py-2 text-sm"
                >
                  <div className="font-medium">{row.action}</div>
                  <div className="text-xs text-[var(--admin-muted)]">
                    {row.slug ?? "—"} · {row.result} · {formatAdminDate(row.createdAt)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {system.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">No system events</p>
            ) : (
              system.map((row) => (
                <div
                  key={row.id}
                  className="rounded border border-[var(--admin-border)] px-3 py-2 text-sm"
                >
                  <div className="font-medium">{row.kind}</div>
                  <div className="text-xs text-[var(--admin-muted)]">
                    {row.message}
                  </div>
                  <div className="text-xs text-[var(--admin-muted)]">
                    {row.slug ?? "—"} · {formatAdminDate(row.createdAt)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
