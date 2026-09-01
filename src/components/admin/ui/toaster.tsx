"use client";

import { Toaster as Sonner } from "sonner";

export function AdminToaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-foreground)]",
          description: "text-[var(--admin-muted)]",
          actionButton: "bg-cyan-600 text-white",
          cancelButton: "bg-[var(--admin-surface-elevated)]",
        },
      }}
    />
  );
}
