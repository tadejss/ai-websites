"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import {
  ADMIN_NAV_ITEMS,
  ADMIN_TAB_HREFS,
  isAdminNavActive,
} from "@/components/admin/admin-nav-items";
import { openAdminMenu } from "@/components/admin/admin-mobile-nav";
import { cn } from "@/lib/utils";

const TAB_ITEMS = ADMIN_NAV_ITEMS.filter((item) =>
  (ADMIN_TAB_HREFS as readonly string[]).includes(item.href),
);

export function AdminTabBar() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin/e/")) {
    return null;
  }

  const moreActive = !TAB_ITEMS.some((item) =>
    isAdminNavActive(pathname, item.href, "exact" in item && item.exact),
  );

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Primary"
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg items-stretch rounded-full border border-white/10 bg-black/90 px-1.5 py-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
        {TAB_ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const exact = "exact" in rest && rest.exact;
          const active = isAdminNavActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px] font-semibold tracking-wide touch-manipulation",
                active
                  ? "text-[var(--admin-accent)]"
                  : "text-[var(--admin-muted)] hover:text-white",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => openAdminMenu()}
          className={cn(
            "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px] font-semibold tracking-wide touch-manipulation",
            moreActive
              ? "text-[var(--admin-accent)]"
              : "text-[var(--admin-muted)] hover:text-white",
          )}
        >
          <MoreHorizontal className="h-5 w-5 shrink-0" />
          <span className="truncate">More</span>
        </button>
      </div>
    </nav>
  );
}
