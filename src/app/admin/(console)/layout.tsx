import { AdminConsoleShell } from "@/components/admin/admin-console-shell";
import { AdminCommandPalette } from "@/components/admin/command-palette";

export default function AdminConsoleLayout({
  children,
}: LayoutProps<"/admin">) {
  return (
    <>
      <AdminConsoleShell>{children}</AdminConsoleShell>
      <AdminCommandPalette />
    </>
  );
}
