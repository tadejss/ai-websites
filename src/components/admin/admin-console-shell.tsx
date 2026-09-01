import { AdminHealthStrip, type HealthPayload } from "@/components/admin/admin-health-strip";
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
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}
