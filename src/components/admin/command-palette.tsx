"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResult = {
  slug: string;
  companyName: string;
  stage: string;
  href: string;
};

export function AdminCommandPalette() {
  const router = useRouter();
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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh]">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl">
        <Command shouldFilter={false} className="bg-transparent">
          <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-3">
            <Search className="h-4 w-4 text-[var(--admin-muted)]" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search slug, company, phone…"
              className="flex h-12 w-full bg-transparent text-sm text-[var(--admin-foreground)] outline-none placeholder:text-[var(--admin-muted)]"
              autoFocus
            />
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-2">
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
                    setOpen(false);
                    setQuery("");
                    router.push(result.href);
                  }}
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-2 text-sm",
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
        className="fixed inset-0 -z-10"
        aria-label="Close command palette"
        onClick={() => setOpen(false)}
      />
    </div>
  );
}
