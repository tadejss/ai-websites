"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Factory,
  Inbox,
  Kanban,
  LayoutList,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Inbox", icon: Inbox, exact: true },
  { href: "/admin/leads", label: "Leads", icon: LayoutList },
  { href: "/admin/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/admin/factory", label: "Factory", icon: Factory },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
] as const;

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex w-56 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)]",
        className,
      )}
    >
      <div className="border-b border-[var(--admin-border)] px-4 py-4">
        <Link
          href="/admin"
          className="text-sm font-semibold tracking-tight text-[var(--admin-foreground)]"
        >
          Website Factory
        </Link>
        <p className="mt-0.5 text-[10px] uppercase tracking-widest text-[var(--admin-muted)]">
          Ops Console
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems.map(({ href, label, icon: Icon, ...rest }) => {
          const exact = "exact" in rest && rest.exact;
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--admin-surface-elevated)] text-cyan-400"
                  : "text-[var(--admin-muted)] hover:bg-[var(--admin-surface-elevated)] hover:text-[var(--admin-foreground)]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--admin-border)] p-3">
        <p className="text-[10px] text-[var(--admin-muted)]">
          <kbd className="rounded border border-[var(--admin-border)] px-1.5 py-0.5 font-mono">
            ⌘K
          </kbd>{" "}
          Command palette
        </p>
      </div>
    </aside>
  );
}
