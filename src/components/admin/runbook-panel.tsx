"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";

const RUNBOOKS: Record<string, { title: string; steps: string[] }> = {
  publish_failed: {
    title: "Publish failed",
    steps: [
      "Open entity journey and read publish_error.",
      "Fix underlying issue (DNS, git, factory lock).",
      "Retry publish from sticky actions.",
      "If stuck >2× lease, cleanup stale factory locks.",
    ],
  },
  circuit_open: {
    title: "Factory circuit open",
    steps: [
      "Check factory ops page for recent failures.",
      "Resolve root cause before dispatching again.",
      "Cleanup stale locks if worker died mid-run.",
      "Dispatch worker manually when healthy.",
    ],
  },
};

export function RunbookPanel({ kind }: { kind: string }) {
  const runbook = RUNBOOKS[kind];
  if (!runbook) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-amber-300">
          Runbook: {runbook.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-1 pl-4 text-xs text-[var(--admin-muted)]">
          {runbook.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
