"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResult = {
  slug: string;
  companyName: string;
  stage: string;
  href: string;
};

export function AdminCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const hideFab = pathname.startsWith("/admin/e/");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

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

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      {!hideFab ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed z-30 flex h-12 w-12 items-center justify-center rounded-full",
            "bg-cyan-600 text-white shadow-lg hover:bg-cyan-500",
            "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4",
            "touch-manipulation md:hidden",
          )}
          aria-label="Search entities"
        >
          <Search className="h-5 w-5" />
        </button>
      ) : null}

      {open ? (
        <div
          className={cn(
            "fixed inset-0 z-50 flex flex-col bg-black/60",
            "md:items-start md:justify-start md:pt-[15vh]",
          )}
        >
          <div
            className={cn(
              "flex flex-1 flex-col overflow-hidden border-[var(--admin-border)] bg-[var(--admin-surface)]",
              "md:mx-auto md:h-auto md:max-h-[70vh] md:w-full md:max-w-lg md:flex-none md:rounded-lg md:shadow-2xl",
            )}
          >
            <Command shouldFilter={false} className="flex flex-1 flex-col bg-transparent md:flex-none">
              <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-3">
                <Search className="h-4 w-4 shrink-0 text-[var(--admin-muted)]" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search slug, company, phone…"
                  className="flex h-14 w-full bg-transparent text-base text-[var(--admin-foreground)] outline-none placeholder:text-[var(--admin-muted)] md:h-12 md:text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={close}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--admin-muted)] touch-manipulation md:hidden"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Command.List className="flex-1 overflow-y-auto p-2 md:max-h-72">
                {loading ? (
                  <div className="px-3 py-6 text-center text-sm text-[var(--admin-muted)]">
                    Searching…
                  </div>
                ) : results.length === 0 ? (
                  <Command.Empty className="px-3 py-6 text-center text-sm text-[var(--admin-muted)]">
                    {query.trim() ? "No results" : "Type to search entities"}
                  </Command.Empty>
                ) : (
                  results.map((result) => (
                    <Command.Item
                      key={result.slug}
                      value={result.slug}
                      onSelect={() => {
                        close();
                        router.push(result.href);
                      }}
                      className={cn(
                        "cursor-pointer rounded-md px-3 py-3 text-sm touch-manipulation md:py-2",
                        "aria-selected:bg-[var(--admin-surface-elevated)]",
                      )}
                    >
                      <div className="font-medium">{result.companyName}</div>
                      <div className="text-xs text-[var(--admin-muted)]">
                        {result.slug} · {result.stage}
                      </div>
                    </Command.Item>
                  ))
                )}
              </Command.List>
            </Command>
          </div>
          <button
            type="button"
            className="hidden flex-1 md:block md:flex-none"
            aria-label="Close command palette"
            onClick={close}
          />
        </div>
      ) : null}
    </>
  );
}
