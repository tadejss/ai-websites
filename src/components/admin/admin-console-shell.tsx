import { AdminHealthStrip, type HealthPayload } from "@/components/admin/admin-health-strip";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getAdminHealthPayload } from "@/admin/health";

export async function AdminConsoleShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const health: HealthPayload = await getAdminHealthPayload();

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHealthStrip initial={health} />
      <div className="flex flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <AdminSidebar className="hidden md:flex" />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
      <AdminMobileNav className="md:hidden" />
    </div>
  );
}
