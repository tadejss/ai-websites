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

export function AdminMobileNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--admin-border)] bg-[var(--admin-surface)]",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      aria-label="Admin navigation"
    >
      <div className="flex h-16 items-stretch justify-around">
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
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1",
                "min-h-[44px] touch-manipulation",
                active ? "text-cyan-400" : "text-[var(--admin-muted)]",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
