"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  warning?: string;
};

export function ApproveChecklistDialog({
  slug,
  items,
  dispatchWarning,
  open,
  onOpenChange,
}: {
  slug: string;
  items: ChecklistItem[];
  dispatchWarning?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [checks, setChecks] = useState(
    () => new Map(items.map((item) => [item.id, item.checked])),
  );
  const [loading, setLoading] = useState(false);

  const allRequired = items
    .filter((item) => !item.warning)
    .every((item) => checks.get(item.id));

  async function approve() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/onboarding/${slug}/approve`, {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Approval failed");
      }
      toast.success("Approved");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve checklist</DialogTitle>
          <DialogDescription>
            Confirm onboarding is ready before approving publish.
          </DialogDescription>
        </DialogHeader>
        {dispatchWarning ? (
          <p className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {dispatchWarning}
          </p>
        ) : null}
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={checks.get(item.id) ?? false}
                onChange={(e) =>
                  setChecks((prev) => new Map(prev).set(item.id, e.target.checked))
                }
              />
              <span>
                {item.label}
                {item.warning ? (
                  <span className="ml-1 text-amber-400">({item.warning})</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <Button
          disabled={!allRequired || loading}
          onClick={() => void approve()}
        >
          {loading ? "Approving…" : "Approve & publish"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
