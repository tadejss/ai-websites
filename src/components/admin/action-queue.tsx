"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { QueueItem } from "@/admin/queue";
import { AdminActionDispatcher } from "@/components/admin/admin-action-dispatcher";
import { useAdminKeyboard } from "@/components/admin/use-admin-keyboard";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<QueueItem["kind"], string> = {
  publish_failed: "FAIL",
  stuck_publishing: "STUCK",
  onboarding_review: "REV",
  qa_failed: "QA",
};

const KIND_VARIANT: Record<
  QueueItem["kind"],
  "destructive" | "warning" | "info" | "default"
> = {
  publish_failed: "destructive",
  stuck_publishing: "warning",
  onboarding_review: "info",
  qa_failed: "destructive",
};

export function ActionQueue({ initialItems }: { initialItems: QueueItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  const selected = items[selectedIndex] ?? null;

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const navigate = useCallback(
    (delta: number) => {
      setSelectedIndex((prev) =>
        Math.max(0, Math.min(items.length - 1, prev + delta)),
      );
    },
    [items],
  );

  useAdminKeyboard({
    enabled: true,
    onNavigateDown: () => navigate(1),
    onNavigateUp: () => navigate(-1),
    onOpen: () => {
      if (selected) router.push(selected.href);
    },
    onApprove: () => {
      if (!selected) return;
      const action = selected.actions.find((a) => a.kind === "approve_onboarding");
      if (action?.enabled) {
        void fetch(`/api/admin/onboarding/${selected.slug}/approve`, {
          method: "POST",
        }).then(async (res) => {
          if (res.ok) {
            toast.success("Approved");
            router.refresh();
          }
        });
      }
    },
    onQueueSms: () => {
      if (!selected) return;
      void fetch("/api/admin/outreach/sms/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selected.slug, step: "initial" }),
      }).then(async (res) => {
        if (res.ok) {
          toast.success("SMS queued");
          router.refresh();
        }
      });
    },
    onRetryPublish: () => {
      if (!selected) return;
      void fetch(`/api/admin/onboarding/${selected.slug}/retry-publish`, {
        method: "POST",
      }).then(async (res) => {
        if (res.ok) {
          toast.success("Publish dispatched");
          router.refresh();
        }
      });
    },
  });

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function toggleAll() {
    if (selectedSlugs.size === items.length) {
      setSelectedSlugs(new Set());
    } else {
      setSelectedSlugs(new Set(items.map((item) => item.slug)));
    }
  }

  async function snoozeSelected() {
    if (!selected) return;
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await fetch("/api/admin/queue/snooze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: selected.slug, until }),
    });
    toast.success("Snoozed 24h");
    router.refresh();
  }

  async function bulkSms() {
    const slugs = [...selectedSlugs];
    if (slugs.length === 0) return;
    const response = await fetch("/api/admin/outreach/sms/bulk-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs }),
    });
    if (response.ok) {
      toast.success(`Queued SMS for ${slugs.length} leads`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
          <input
            type="checkbox"
            checked={items.length > 0 && selectedSlugs.size === items.length}
            onChange={() => toggleAll()}
          />
          Select all
        </label>
        {selectedSlugs.size > 0 ? (
          <Button variant="success" size="sm" onClick={() => void bulkSms()}>
            Bulk SMS ({selectedSlugs.size})
          </Button>
        ) : null}
        {selected ? (
          <Button variant="ghost" size="sm" onClick={() => void snoozeSelected()}>
            Snooze 24h
          </Button>
        ) : null}
      </div>

      <div className="rounded-[var(--admin-radius)] border border-white/15 bg-white/[0.03]">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-base text-[var(--admin-muted)]">
            Nothing needs action
          </p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {items.map((item, index) => (
              <li
                key={`${item.kind}-${item.slug}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 transition-colors",
                  index === selectedIndex && "bg-[var(--admin-surface-elevated)]",
                )}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <input
                  type="checkbox"
                  checked={selectedSlugs.has(item.slug)}
                  onChange={() => toggleSlug(item.slug)}
                />
                <Badge variant={KIND_VARIANT[item.kind]} className="shrink-0">
                  {KIND_LABEL[item.kind]}
                </Badge>
                <div className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    className="block truncate text-base font-medium hover:text-[var(--admin-accent)]"
                  >
                    {item.companyName}
                  </Link>
                  <p className="truncate text-sm text-[var(--admin-muted)]">
                    {item.subtitle}
                  </p>
                </div>
                <a
                  href={`/${item.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-sm text-[var(--admin-accent)] hover:underline"
                >
                  Demo ↗
                </a>
                <AdminActionDispatcher
                  slug={item.slug}
                  actions={item.actions}
                  layout="inline"
                  demoUrl={`/${item.slug}`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
