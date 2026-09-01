"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getFactoryWorkerConfig } from "@/factory/config";
import { getEntityIndexCount } from "@/admin/entity-index";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";

type SettingsData = {
  factory: ReturnType<typeof getFactoryWorkerConfig>;
  indexCount: number;
};

export function AdminSettingsClient({ data }: { data: SettingsData }) {
  const [loading, setLoading] = useState(false);

  async function refreshIndex() {
    setLoading(true);
    try {
      const response = await fetch("/api/cron/refresh-admin-index");
      const result = (await response.json()) as { count?: number; error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Refresh failed");
      }
      toast.success(`Index refreshed (${result.count ?? 0} rows)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Read-only env flags and maintenance"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Factory flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Flag label="Worker enabled" value={data.factory.enabled} />
            <Flag label="Dispatch enabled" value={data.factory.dispatchEnabled} />
            <Flag label="Publish enabled" value={data.factory.publishEnabled} />
            <Flag label="GitHub repo" value={data.factory.githubRepo ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entity index</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--admin-muted)]">
              {data.indexCount} rows in admin_entity_index
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={loading}
              onClick={() => void refreshIndex()}
            >
              {loading ? "Refreshing…" : "Refresh index"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Flag({ label, value }: { label: string; value: boolean | string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--admin-muted)]">{label}</span>
      <span className="font-mono text-xs">
        {typeof value === "boolean" ? (value ? "ON" : "OFF") : value}
      </span>
    </div>
  );
}
