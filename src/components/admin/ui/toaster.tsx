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
            "rounded-[var(--admin-radius)] border border-white/15 bg-[var(--admin-surface)] text-[var(--admin-foreground)]",
          description: "text-[var(--admin-muted)]",
          actionButton: "bg-[var(--admin-accent)] text-black",
          cancelButton: "bg-[var(--admin-surface-elevated)]",
        },
      }}
    />
  );
}
