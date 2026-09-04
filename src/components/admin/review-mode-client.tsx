"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AdminAction } from "@/admin/entity";
import { AdminActionDispatcher } from "@/components/admin/admin-action-dispatcher";
import { Button } from "@/components/admin/ui/button";

type ReviewItem = {
  slug: string;
  companyName: string;
  actions: AdminAction[];
  galleryCount: number;
  answers: Record<string, unknown> | null;
};

export function ReviewModeClient({ items }: { items: ReviewItem[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const current = items[index];

  async function approveAndNext() {
    const response = await fetch(
      `/api/admin/onboarding/${current.slug}/approve`,
      { method: "POST" },
    );
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      toast.error(data.error || "Approve failed");
      return;
    }
    toast.success("Approved");
    if (index < items.length - 1) {
      setIndex((prev) => prev + 1);
    }
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">
            {current.companyName} · {index + 1}/{items.length}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={index >= items.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next
            </Button>
          </div>
        </div>
        <iframe
          src={`/${current.slug}`}
          title={`Demo ${current.slug}`}
          className="h-[min(70vh,600px)] w-full rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-white"
        />
      </div>
      <div className="space-y-4 rounded-[var(--admin-radius)] border border-white/15 bg-white/[0.03] p-4">
        <h3 className="font-medium">{current.companyName}</h3>
        <p className="text-xs text-[var(--admin-muted)] font-mono">{current.slug}</p>
        <dl className="space-y-2 text-sm">
          {current.answers
            ? Object.entries(current.answers)
                .slice(0, 12)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <dt className="text-[var(--admin-muted)]">{key}</dt>
                    <dd className="text-right font-mono text-xs">
                      {String(value).slice(0, 80)}
                    </dd>
                  </div>
                ))
            : null}
        </dl>
        <p className="text-xs text-[var(--admin-muted)]">
          Gallery: {current.galleryCount} images
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void approveAndNext()}>Approve & Next</Button>
          <AdminActionDispatcher
            slug={current.slug}
            actions={current.actions}
            layout="inline"
            demoUrl={`/${current.slug}`}
          />
        </div>
      </div>
    </div>
  );
}
