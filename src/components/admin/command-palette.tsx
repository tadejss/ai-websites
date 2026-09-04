"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_SEARCH_EVENT = "admin-search-open";

export function openAdminSearch() {
  window.dispatchEvent(new Event(ADMIN_SEARCH_EVENT));
}

type SearchResult = {
  slug: string;
  companyName: string;
  stage: string;
  href: string;
};

const ACTION_ITEMS = [
  {
    id: "dispatch-factory",
    label: "Dispatch factory worker",
    href: "/admin/factory",
    action: "factory_dispatch",
  },
  {
    id: "publish-failed",
    label: "Go to publish failed queue",
    href: "/admin",
    action: "navigate",
  },
  {
    id: "sms-actionable",
    label: "Queue SMS actionable leads view",
    href: "/admin/leads?pipeline=actionable",
    action: "navigate",
  },
  {
    id: "review",
    label: "Open onboarding",
    href: "/admin/review",
    action: "navigate",
  },
] as const;

export function AdminCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"search" | "actions">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onSearchEvent() {
      setMode("search");
      setOpen(true);
    }
    window.addEventListener(ADMIN_SEARCH_EVENT, onSearchEvent);
    return () => window.removeEventListener(ADMIN_SEARCH_EVENT, onSearchEvent);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k" && !event.shiftKey) {
        event.preventDefault();
        setMode("search");
        setOpen((prev) => !prev);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "k" && event.shiftKey) {
        event.preventDefault();
        setMode("actions");
        setOpen(true);
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
    if (mode !== "search") return;
    const timer = setTimeout(() => {
      void search(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, search, mode]);

  function close() {
    setOpen(false);
    setQuery("");
    setMode("search");
  }

  async function runAction(item: typeof ACTION_ITEMS[number]) {
    if (item.action === "factory_dispatch") {
      await fetch("/api/admin/factory/dispatch", { method: "POST" });
    }
    close();
    router.push(item.href);
    router.refresh();
  }

  const filteredActions = ACTION_ITEMS.filter((item) =>
    !query.trim()
      ? true
      : item.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      {open ? (
        <div
          className={cn(
            "fixed inset-0 z-50 flex flex-col bg-black/60",
            "md:items-start md:justify-start md:pt-[15vh]",
          )}
        >
          <div
            className={cn(
              "flex flex-1 flex-col overflow-hidden border-white/15 bg-black",
              "md:mx-auto md:h-auto md:max-h-[70vh] md:w-full md:max-w-lg md:flex-none md:rounded-[var(--admin-radius)] md:border md:shadow-2xl",
            )}
          >
            <Command shouldFilter={false} className="flex flex-1 flex-col bg-transparent md:flex-none">
              <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-3">
                {mode === "actions" ? (
                  <Zap className="h-4 w-4 shrink-0 text-amber-400" />
                ) : (
                  <Search className="h-4 w-4 shrink-0 text-[var(--admin-muted)]" />
                )}
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder={
                    mode === "actions"
                      ? "Run an action…"
                      : "Search slug, company, phone…"
                  }
                  className="flex h-14 w-full bg-transparent text-base text-[var(--admin-foreground)] outline-none placeholder:text-[var(--admin-muted)] md:h-12 md:text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={close}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--admin-muted)] touch-manipulation md:hidden"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Command.List className="flex-1 overflow-y-auto p-2 md:max-h-72">
                {mode === "actions" ? (
                  filteredActions.length === 0 ? (
                    <Command.Empty className="px-3 py-6 text-center text-sm text-[var(--admin-muted)]">
                      No actions match
                    </Command.Empty>
                  ) : (
                    filteredActions.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => void runAction(item)}
                        className="cursor-pointer rounded-2xl px-3 py-3 text-sm touch-manipulation md:py-2 aria-selected:bg-[var(--admin-surface-elevated)] aria-selected:text-[var(--admin-accent)]"
                      >
                        {item.label}
                      </Command.Item>
                    ))
                  )
                ) : loading ? (
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
                      className="cursor-pointer rounded-2xl px-3 py-3 text-sm touch-manipulation md:py-2 aria-selected:bg-[var(--admin-surface-elevated)] aria-selected:text-[var(--admin-accent)]"
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
