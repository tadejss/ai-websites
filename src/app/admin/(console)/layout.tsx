import { AdminConsoleShell } from "@/components/admin/admin-console-shell";
import { AdminCommandPalette } from "@/components/admin/command-palette";
import { AdminShortcutsOverlay } from "@/components/admin/admin-shortcuts-overlay";
import { AdminToaster } from "@/components/admin/ui/toaster";
import { TooltipProvider } from "@/components/admin/ui/tooltip";

export default function AdminConsoleLayout({
  children,
}: LayoutProps<"/admin">) {
  return (
    <TooltipProvider>
      <AdminConsoleShell>{children}</AdminConsoleShell>
      <AdminCommandPalette />
      <AdminShortcutsOverlay />
      <AdminToaster />
    </TooltipProvider>
  );
}
