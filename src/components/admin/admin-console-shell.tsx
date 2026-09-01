import { AdminHealthStrip, type HealthPayload } from "@/components/admin/admin-health-strip";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminRealtimeProvider } from "@/components/admin/admin-realtime-provider";
import { IncidentStrip } from "@/components/admin/ui/incident-strip";
import { getAdminHealthPayload } from "@/admin/health";
import { getFactoryOpsSnapshot } from "@/factory/ops-snapshot";

export async function AdminConsoleShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [health, snapshot]: [HealthPayload, Awaited<ReturnType<typeof getFactoryOpsSnapshot>>] =
    await Promise.all([getAdminHealthPayload(), getFactoryOpsSnapshot()]);

  const criticalMessage = snapshot.worker.circuitOpen
    ? "Factory circuit open — dispatch disabled until resolved"
    : health.factory.level === "failed"
      ? `Factory: ${health.factory.detail}`
      : null;

  return (
    <AdminRealtimeProvider initialHealth={health}>
      <div className="flex min-h-screen flex-col">
        {criticalMessage ? (
          <IncidentStrip message={criticalMessage} />
        ) : null}
        <AdminHealthStrip initial={health} />
        <div className="flex flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          <AdminSidebar className="hidden md:flex" />
          <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
        </div>
        <AdminMobileNav className="md:hidden" />
      </div>
    </AdminRealtimeProvider>
  );
}
