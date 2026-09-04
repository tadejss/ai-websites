"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminBrandMark, AdminWordmark } from "@/components/admin/admin-brand";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/components/admin/admin-nav-items";
import { cn } from "@/lib/utils";

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col border-r border-[var(--admin-border)] bg-black",
        className,
      )}
    >
      <div className="border-b border-[var(--admin-border)] px-4 py-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <AdminBrandMark size={36} />
          <AdminWordmark />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const exact = "exact" in rest && rest.exact;
          const active = isAdminNavActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl px-3 py-2 text-base transition-colors",
                active
                  ? "bg-[var(--admin-surface-elevated)] text-[var(--admin-accent)] shadow-[inset_0_0_0_1px_rgba(199,255,61,0.28)]"
                  : "text-[#d0d0d0] hover:bg-[var(--admin-surface-elevated)] hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
