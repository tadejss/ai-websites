import { AdminHealthStrip } from "@/components/admin/admin-health-strip";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminRealtimeProvider } from "@/components/admin/admin-realtime-provider";
import { IncidentStrip } from "@/components/admin/ui/incident-strip";
import { getAdminHealthPayload } from "@/admin/health";

export async function AdminConsoleShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const health = await getAdminHealthPayload();

  const criticalMessage =
    health.factory.level === "failed"
      ? health.factory.detail === "circuit open"
        ? "Factory circuit open — dispatch disabled until resolved"
        : `Factory: ${health.factory.detail}`
      : null;

  return (
    <AdminRealtimeProvider initialHealth={health}>
      <div className="flex min-h-screen flex-col">
        {criticalMessage ? <IncidentStrip message={criticalMessage} /> : null}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          <AdminMobileNav className="md:hidden" />
          <AdminHealthStrip initial={health} />
        </header>
        <div className="flex flex-1">
          <AdminSidebar className="hidden md:flex" />
          <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AdminRealtimeProvider>
  );
}
