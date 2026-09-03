import Link from "next/link";
import { getFactoryOpsSnapshot } from "@/factory/ops-snapshot";
import type { OpsHealthLevel } from "@/factory/ops-health";
import {
  AdminCleanupLocksButton,
  AdminFactoryDispatchButton,
} from "@/components/admin/admin-actions";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
  AdminTableWrap,
  AdminTd,
  AdminTh,
  formatAdminDate,
} from "@/components/admin/admin-page";
import { DiscoveryHeatmap } from "@/components/admin/discovery-heatmap";
import { Badge } from "@/components/admin/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { StatusLed } from "@/components/admin/ui/status-led";
import { FactoryRunsSparkline } from "@/components/admin/factory-runs-chart";

export const dynamic = "force-dynamic";

function healthVariant(level: OpsHealthLevel): "success" | "warning" | "destructive" {
  switch (level) {
    case "ok":
      return "success";
    case "warning":
      return "warning";
    case "failed":
      return "destructive";
  }
}

function ledLevel(level: OpsHealthLevel): "ok" | "warning" | "failed" {
  return level;
}

export default async function AdminFactoryPage() {
  const snapshot = await getFactoryOpsSnapshot();

  return (
    <div>
      <AdminPageHeader
        title="Factory Live Ops"
        description={`Snapshot ${formatAdminDate(snapshot.fetchedAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusLed level={ledLevel(snapshot.health.level)} pulse />
            <Badge variant={healthVariant(snapshot.health.level)}>
              {snapshot.health.level.toUpperCase()}
            </Badge>
          </div>
        }
      />

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap [&>div]:w-full sm:[&>div]:w-auto [&_button]:min-h-[44px] [&_button]:w-full sm:[&_button]:w-auto">
        <AdminFactoryDispatchButton />
        <AdminCleanupLocksButton />
      </div>

      {snapshot.health.issues.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Health issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {snapshot.health.issues.map((issue) => (
              <div
                key={issue.code}
                className="rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm"
              >
                <Badge variant={healthVariant(issue.level)} className="mr-2">
                  {issue.level}
                </Badge>
                {issue.message}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AdminStatGrid className="grid-cols-2">
        <AdminStatCard
          label="Worker"
          value={snapshot.worker.activeLease?.status ?? "idle"}
        />
        <AdminStatCard
          label="Backlog"
          value={`${snapshot.replenish.actionable}/${snapshot.replenish.target}`}
          sub={`need ${snapshot.replenish.needed}`}
        />
        <AdminStatCard
          label="Failures"
          value={String(snapshot.worker.consecutiveFailures)}
          sub={snapshot.worker.circuitOpen ? "circuit open" : "ok"}
        />
        <AdminStatCard
          label="Stale locks"
          value={String(snapshot.generationLocks.staleGenerating)}
        />
        <AdminStatCard
          label="Grok QA"
          value={`${snapshot.grokQa.pending} pending`}
          sub={`${snapshot.grokQa.failed} failed`}
        />
      </AdminStatGrid>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Run activity (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <FactoryRunsSparkline runs={snapshot.worker.recentRuns} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discovery matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-[var(--admin-muted)]">
              {snapshot.discovery.combinationsCompleted}/
              {snapshot.discovery.combinationsTotal} cells ·{" "}
              {snapshot.discovery.currentRegion} ×{" "}
              {snapshot.discovery.currentProfession}
            </p>
            <DiscoveryHeatmap />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.worker.recentRuns.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No runs recorded</p>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminTh>Started</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>Gen</AdminTh>
                  <AdminTh>Pub</AdminTh>
                  <AdminTh>Fail</AdminTh>
                  <AdminTh>Error</AdminTh>
                </tr>
              </thead>
              <tbody>
                {snapshot.worker.recentRuns.map((run) => (
                  <tr key={run.runId}>
                    <AdminTd>{formatAdminDate(run.startedAt)}</AdminTd>
                    <AdminTd>{run.status}</AdminTd>
                    <AdminTd>{run.demosGenerated}</AdminTd>
                    <AdminTd>{run.demosPublished}</AdminTd>
                    <AdminTd>{run.demosFailed}</AdminTd>
                    <AdminTd className="max-w-xs truncate text-red-400">
                      {run.error ?? "—"}
                    </AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer publishing</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminStatGrid className="mb-0 lg:grid-cols-2">
              <AdminStatCard
                label="Waiting approval"
                value={String(snapshot.customerPublish.waitingApproval)}
              />
              <AdminStatCard
                label="Publish failed"
                value={String(snapshot.customerPublish.publishFailed)}
              />
              <AdminStatCard
                label="Publishing"
                value={String(snapshot.customerPublish.publishing)}
              />
              <AdminStatCard
                label="Queued"
                value={String(snapshot.customerPublish.queuedForPublish)}
              />
            </AdminStatGrid>
            {snapshot.customerPublish.publishFailedRows.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm">
                {snapshot.customerPublish.publishFailedRows.map((row) => (
                  <li key={row.slug}>
                    <Link
                      href={`/admin/e/${row.slug}`}
                      className="text-cyan-400 hover:underline"
                    >
                      {row.slug}
                    </Link>
                    <span className="text-[var(--admin-muted)]">
                      {" "}
                      · {formatAdminDate(row.updatedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMS queue</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminStatGrid className="mb-0 lg:grid-cols-2">
              <AdminStatCard
                label="Sent today"
                value={`${snapshot.sms.sentToday}/${snapshot.sms.dailyLimit}`}
              />
              <AdminStatCard
                label="Gateway"
                value={snapshot.sms.gatewayConfigured ? "online" : "offline"}
              />
              <AdminStatCard
                label="Never viewed demos"
                value={String(snapshot.demoLifecycle.publishedNeverViewed)}
              />
              <AdminStatCard
                label="Dispatch"
                value={snapshot.config.dispatchEnabled ? "on" : "off"}
              />
            </AdminStatGrid>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
