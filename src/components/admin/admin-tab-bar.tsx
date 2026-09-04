"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Menu, Search } from "lucide-react";
import {
  ADMIN_NAV_ITEMS,
  ADMIN_TAB_HREFS,
  isAdminNavActive,
} from "@/components/admin/admin-nav-items";
import { Sheet, SheetContent, SheetTitle } from "@/components/admin/ui/sheet";
import { cn } from "@/lib/utils";

const TAB_ITEMS = ADMIN_NAV_ITEMS.filter((item) =>
  (ADMIN_TAB_HREFS as readonly string[]).includes(item.href),
);

const MORE_ITEMS = ADMIN_NAV_ITEMS.filter(
  (item) => !(ADMIN_TAB_HREFS as readonly string[]).includes(item.href),
);

type SearchResult = {
  slug: string;
  companyName: string;
  stage: string;
  href: string;
};

export function AdminTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (value: string) => {
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/leads?search=${encodeURIComponent(value.trim())}`,
      );
      if (response.ok) {
        const data = (await response.json()) as { results: SearchResult[] };
        setResults(data.results);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void search(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const moreActive = MORE_ITEMS.some((item) =>
    isAdminNavActive(pathname, item.href, "exact" in item && item.exact),
  );

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

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
        <Sheet
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) {
              setQuery("");
              setResults([]);
            }
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px] font-semibold tracking-wide touch-manipulation",
              moreActive
                ? "text-[var(--admin-accent)]"
                : "text-[var(--admin-muted)] hover:text-white",
            )}
          >
            <Menu className="h-5 w-5 shrink-0" />
            <span className="truncate">More</span>
          </button>
          <SheetContent
            side="bottom"
            className="overflow-hidden rounded-3xl pb-3 pt-10"
          >
            <SheetTitle className="sr-only">More</SheetTitle>
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-3">
              <label className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3">
                <Search className="h-4 w-4 shrink-0 text-[var(--admin-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  autoComplete="off"
                  className="h-11 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-[var(--admin-muted)]"
                />
              </label>
              {query.trim() ? (
                <div className="max-h-40 overflow-y-auto">
                  {loading ? (
                    <p className="px-2 py-3 text-sm text-[var(--admin-muted)]">
                      Searching…
                    </p>
                  ) : results.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-[var(--admin-muted)]">
                      No results
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-0.5">
                      {results.map((result) => (
                        <li key={result.slug}>
                          <button
                            type="button"
                            onClick={() => {
                              close();
                              router.push(result.href);
                            }}
                            className="flex w-full flex-col items-start rounded-2xl px-3 py-2 text-left touch-manipulation hover:bg-[var(--admin-surface-elevated)]"
                          >
                            <span className="text-sm font-medium text-white">
                              {result.companyName}
                            </span>
                            <span className="text-xs text-[var(--admin-muted)]">
                              {result.slug} · {result.stage}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
              <nav className="flex flex-col gap-0.5 overflow-y-auto">
                {MORE_ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
                  const exact = "exact" in rest && rest.exact;
                  const active = isAdminNavActive(pathname, href, exact);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => close()}
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
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
