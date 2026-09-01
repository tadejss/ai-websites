"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/button";

export function AdminBulkSmsButton({ slugs }: { slugs: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (slugs.length === 0) {
    return null;
  }

  async function handleBulk() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/outreach/sms/bulk-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs }),
      });
      const data = (await response.json()) as {
        error?: string;
        queued?: number;
      };
      if (!response.ok) {
        throw new Error(data.error || "Bulk queue failed");
      }
      setMessage(`Queued ${data.queued ?? 0} of ${slugs.length}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Bulk queue failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="success"
        size="sm"
        disabled={loading}
        onClick={() => void handleBulk()}
      >
        {loading ? "Queuing…" : `Bulk SMS (${slugs.length})`}
      </Button>
      {message ? (
        <span className="text-xs text-[var(--admin-muted)]">{message}</span>
      ) : null}
    </div>
  );
}

export function AdminLeadsBulkBar({
  slugs,
  selected,
  onToggle,
  onToggleAll,
}: {
  slugs: string[];
  selected: string[];
  onToggle: (slug: string) => void;
  onToggleAll: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={selected.length === slugs.length && slugs.length > 0}
          onChange={onToggleAll}
          className="rounded border-[var(--admin-border)]"
        />
        Select page ({selected.length})
      </label>
      <AdminBulkSmsButton slugs={selected} />
      <div className="flex flex-wrap gap-2">
        {slugs.map((slug) => (
          <label key={slug} className="sr-only">
            <input
              type="checkbox"
              checked={selected.includes(slug)}
              onChange={() => onToggle(slug)}
            />
            {slug}
          </label>
        ))}
      </div>
    </div>
  );
}

export function LeadRowCheckbox({
  slug,
  selected,
  onToggle,
}: {
  slug: string;
  selected: boolean;
  onToggle: (slug: string) => void;
}) {
  return (
    <input
      type="checkbox"
      checked={selected}
      onChange={() => onToggle(slug)}
      className="rounded border-[var(--admin-border)]"
      aria-label={`Select ${slug}`}
    />
  );
}
