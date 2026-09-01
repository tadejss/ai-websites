"use client";

import { cn } from "@/lib/utils";

export function IncidentStrip({
  message,
  action,
  onAction,
}: {
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300",
      )}
    >
      <span>⚠ {message}</span>
      {action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded border border-red-500/40 px-2 py-1 text-xs hover:bg-red-500/20"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
