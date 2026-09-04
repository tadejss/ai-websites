"use client";

import { useState } from "react";
import { AdminActionDispatcher } from "@/components/admin/admin-action-dispatcher";
import { ApproveChecklistDialog } from "@/components/admin/approve-checklist-dialog";
import { Button } from "@/components/admin/ui/button";
import type { AdminAction } from "@/admin/entity";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  warning?: string;
};

export function EntityJourneyActions({
  slug,
  actions,
  onboardingUrl,
  demoUrl,
  dispatchWarning,
  checklistItems,
  lastFailedMessageId,
}: {
  slug: string;
  actions: AdminAction[];
  onboardingUrl: string | null;
  demoUrl: string;
  dispatchWarning: string | null;
  checklistItems: ChecklistItem[];
  lastFailedMessageId?: string | null;
}) {
  const [approveOpen, setApproveOpen] = useState(false);
  const canApprove = actions.some(
    (action) => action.kind === "approve_onboarding" && action.enabled,
  );

  return (
    <>
      <div
        className={cn(
          "z-20 mb-6 flex flex-wrap gap-2 rounded-[var(--admin-radius)] border border-white/15 bg-black/90 p-3 backdrop-blur-md",
          "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:mb-0 max-md:rounded-none max-md:border-x-0 max-md:border-b-0 max-md:pb-[env(safe-area-inset-bottom)]",
          "md:sticky md:top-0",
        )}
      >
        {canApprove ? (
          <Button size="sm" onClick={() => setApproveOpen(true)}>
            Approve checklist
          </Button>
        ) : null}
        <AdminActionDispatcher
          slug={slug}
          actions={actions}
          layout="row"
          onboardingUrl={onboardingUrl}
          demoUrl={demoUrl}
          lastFailedMessageId={lastFailedMessageId}
        />
      </div>

      <ApproveChecklistDialog
        slug={slug}
        items={checklistItems}
        dispatchWarning={dispatchWarning}
        open={approveOpen}
        onOpenChange={setApproveOpen}
      />
    </>
  );
}
