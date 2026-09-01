"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Factory,
  Inbox,
  LayoutList,
  Star,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Inbox", icon: Inbox, exact: true },
  { href: "/admin/review", label: "Review", icon: Star },
  { href: "/admin/leads", label: "Leads", icon: LayoutList },
  { href: "/admin/factory", label: "Factory", icon: Factory },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/activity", label: "Activity", icon: Activity },
] as const;

export function AdminMobileNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const onEntity = pathname.startsWith("/admin/e/");

  return (
    <>
      {onEntity ? (
        <Link
          href="/admin"
          className={cn(
            "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-30",
            "flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg md:hidden",
          )}
          aria-label="Back to queue"
        >
          <Inbox className="h-5 w-5" />
        </Link>
      ) : null}
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
    </>
  );
}
