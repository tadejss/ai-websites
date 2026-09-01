"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function EntityPreviewPanel({ slug }: { slug: string }) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setViewport("desktop")}
          className={cn(
            "rounded px-2 py-1 text-xs",
            viewport === "desktop"
              ? "bg-cyan-600 text-white"
              : "bg-[var(--admin-surface-elevated)]",
          )}
        >
          Desktop
        </button>
        <button
          type="button"
          onClick={() => setViewport("mobile")}
          className={cn(
            "rounded px-2 py-1 text-xs",
            viewport === "mobile"
              ? "bg-cyan-600 text-white"
              : "bg-[var(--admin-surface-elevated)]",
          )}
        >
          Mobile
        </button>
      </div>
      <div className="flex justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] p-2">
        <iframe
          src={`/${slug}`}
          title={`Preview ${slug}`}
          className={cn(
            "rounded border border-[var(--admin-border)] bg-white transition-all",
            viewport === "mobile" ? "h-[480px] w-[375px]" : "h-[480px] w-full",
          )}
        />
      </div>
    </div>
  );
}
