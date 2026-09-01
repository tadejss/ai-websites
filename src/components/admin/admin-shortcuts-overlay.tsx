"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SHORTCUTS = [
  { keys: ["⌘", "K"], action: "Search entities" },
  { keys: ["⌘", "⇧", "K"], action: "Action palette" },
  { keys: ["?"], action: "Shortcuts help" },
  { keys: ["j", "k"], action: "Queue navigate" },
  { keys: ["a"], action: "Approve (context)" },
  { keys: ["s"], action: "Queue SMS" },
  { keys: ["r"], action: "Retry publish" },
  { keys: ["Enter"], action: "Open entity" },
  { keys: ["Esc"], action: "Close overlay" },
  { keys: ["[", "]"], action: "Prev / next entity" },
];

export function AdminShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key === "?" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !(event.target as HTMLElement)?.closest("input,textarea,select")
      ) {
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Keyboard shortcuts</h2>
        <ul className="mt-4 space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.action}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-[var(--admin-muted)]">{shortcut.action}</span>
              <span className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className={cn(
                      "rounded border border-[var(--admin-border)] px-1.5 py-0.5 font-mono text-xs",
                    )}
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
