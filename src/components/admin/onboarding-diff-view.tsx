"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type DiffLine = { key: string; demo?: string; onboarding?: string };

function flatten(obj: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj === null || obj === undefined) return out;
  if (typeof obj !== "object") {
    out[prefix] = String(obj);
    return out;
  }
  if (Array.isArray(obj)) {
    out[prefix] = JSON.stringify(obj);
    return out;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, path));
    } else {
      out[path] = JSON.stringify(value);
    }
  }
  return out;
}

export function OnboardingDiffView({
  demoSite,
  processedPayload,
}: {
  demoSite: Record<string, unknown> | null;
  processedPayload: Record<string, unknown> | null;
}) {
  const [open, setOpen] = useState(false);
  const demoFlat = flatten(demoSite ?? {});
  const onboardFlat = flatten(processedPayload ?? {});
  const keys = [...new Set([...Object.keys(demoFlat), ...Object.keys(onboardFlat)])];
  const lines: DiffLine[] = keys
    .filter((key) => demoFlat[key] !== onboardFlat[key])
    .slice(0, 40)
    .map((key) => ({
      key,
      demo: demoFlat[key],
      onboarding: onboardFlat[key],
    }));

  if (lines.length === 0) {
    return (
      <p className="text-xs text-[var(--admin-muted)]">No diff (or no payload)</p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-cyan-400 hover:underline"
      >
        {open ? "Hide" : "Show"} diff ({lines.length} fields)
      </button>
      {open ? (
        <ul className="mt-2 space-y-1 max-h-48 overflow-auto text-xs">
          {lines.map((line) => (
            <li
              key={line.key}
              className="rounded border border-[var(--admin-border)] px-2 py-1"
            >
              <span className="font-mono text-[var(--admin-muted)]">{line.key}</span>
              <div className="text-red-300">− {line.demo ?? "—"}</div>
              <div className="text-emerald-300">+ {line.onboarding ?? "—"}</div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
