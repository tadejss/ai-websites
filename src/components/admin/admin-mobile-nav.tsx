"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AdminBrandMark, AdminWordmark } from "@/components/admin/admin-brand";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/components/admin/admin-nav-items";
import { openAdminSearch } from "@/components/admin/command-palette";
import { Sheet, SheetContent, SheetTitle } from "@/components/admin/ui/sheet";
import { cn } from "@/lib/utils";

export const ADMIN_MENU_EVENT = "admin-menu-open";

export function openAdminMenu() {
  window.dispatchEvent(new Event(ADMIN_MENU_EVENT));
}

export function AdminMobileNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(ADMIN_MENU_EVENT, onOpen);
    return () => window.removeEventListener(ADMIN_MENU_EVENT, onOpen);
  }, []);

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2", className)}>
      <button
        type="button"
        onClick={() => openAdminSearch()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent)] text-black touch-manipulation"
        aria-label="Išči"
      >
        <Search className="h-5 w-5" />
      </button>
      <Link href="/admin" className="flex min-w-0 flex-1 items-center justify-center gap-2">
        <AdminBrandMark size={32} />
        <AdminWordmark className="text-lg" />
      </Link>
      <div className="h-11 w-11 shrink-0" aria-hidden />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-72 max-w-[85vw] bg-black pt-[calc(env(safe-area-inset-top)+0.75rem)]"
        >
          <SheetTitle className="flex items-center gap-2.5 px-4 pb-3">
            <AdminBrandMark size={32} />
            <AdminWordmark />
          </SheetTitle>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-6">
            {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
              const exact = "exact" in rest && rest.exact;
              const active = isAdminNavActive(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-2xl px-3 py-2 text-base touch-manipulation",
                    active
                      ? "bg-[var(--admin-surface-elevated)] text-[var(--admin-accent)]"
                      : "text-[#d0d0d0] hover:bg-[var(--admin-surface-elevated)] hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
