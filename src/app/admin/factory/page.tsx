import Link from "next/link";
import { getFactoryOpsSnapshot } from "@/factory/ops-snapshot";
import type { OpsHealthLevel } from "@/factory/ops-health";

export const dynamic = "force-dynamic";

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString("sl-SI");
}

function healthBadgeClass(level: OpsHealthLevel): string {
  switch (level) {
    case "ok":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "failed":
      return "border-red-200 bg-red-50 text-red-800";
  }
}

function healthLabel(level: OpsHealthLevel): string {
  switch (level) {
    case "ok":
      return "OK";
    case "warning":
      return "Warning";
    case "failed":
      return "Failed";
  }
}

function boolLabel(value: boolean): string {
  return value ? "yes" : "no";
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

export default async function AdminFactoryPage() {
  const snapshot = await getFactoryOpsSnapshot();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Factory operations</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Read-only operational snapshot from Neon · refreshed on each page load
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Snapshot at {formatDate(snapshot.fetchedAt)}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-medium ${healthBadgeClass(snapshot.health.level)}`}
        >
          {healthLabel(snapshot.health.level)}
        </span>
      </div>

      {snapshot.health.issues.length > 0 && (
        <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Health issues
          </h2>
          <ul className="mt-3 space-y-2">
            {snapshot.health.issues.map((issue) => (
              <li
                key={issue.code}
                className={`rounded-md border px-3 py-2 text-sm ${healthBadgeClass(issue.level)}`}
              >
                {issue.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Factory</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Worker enabled"
            value={boolLabel(snapshot.config.factoryEnabled)}
          />
          <StatCard
            label="Dispatch enabled"
            value={boolLabel(snapshot.config.dispatchEnabled)}
          />
          <StatCard
            label="Publish enabled"
            value={boolLabel(snapshot.config.publishEnabled)}
          />
          <StatCard
            label="Dispatch ready"
            value={boolLabel(snapshot.config.dispatchReady)}
          />
          <StatCard
            label="Consecutive failures"
            value={String(snapshot.worker.consecutiveFailures)}
          />
          <StatCard
            label="Circuit open"
            value={boolLabel(snapshot.worker.circuitOpen)}
          />
          <StatCard
            label="Cooldown active"
            value={boolLabel(snapshot.worker.cooldownActive)}
          />
          <StatCard
            label="Active lease"
            value={
              snapshot.worker.activeLease
                ? snapshot.worker.activeLease.status
                : "none"
            }
          />
          <StatCard
            label="Actionable leads"
            value={String(snapshot.replenish.actionable)}
          />
          <StatCard label="Target" value={String(snapshot.replenish.target)} />
          <StatCard label="Needed" value={String(snapshot.replenish.needed)} />
          <StatCard
            label="Discovery progress"
            value={formatDate(snapshot.discovery.progressUpdatedAt)}
          />
        </div>

        {!snapshot.config.dispatchEnabled && snapshot.replenish.needed > 0 && (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Automatic replenishment is disabled. {snapshot.replenish.needed} demos
            are still needed — run{" "}
            <code className="text-xs">npm run factory-worker</code> manually or
            enable <code className="text-xs">FACTORY_DISPATCH_ENABLED</code>.
          </p>
        )}

        {snapshot.worker.activeLease && (
          <p className="mb-4 text-sm text-neutral-600">
            Lease run {snapshot.worker.activeLease.runId.slice(0, 8)}… · worker{" "}
            {snapshot.worker.activeLease.workerId} · expires{" "}
            {formatDate(snapshot.worker.activeLease.expiresAt)}
            {snapshot.worker.activeLease.isExpired ? " (expired)" : ""}
          </p>
        )}

        {snapshot.worker.latestErrorRun?.error && (
          <details className="mb-4 text-sm">
            <summary className="cursor-pointer font-medium text-red-700">
              Latest worker error
            </summary>
            <p className="mt-2 rounded-md border border-red-100 bg-red-50 p-3 text-red-800">
              {snapshot.worker.latestErrorRun.error}
            </p>
          </details>
        )}

        <h3 className="mb-2 text-sm font-semibold text-neutral-700">
          Recent runs
        </h3>
        {snapshot.worker.recentRuns.length === 0 ? (
          <p className="text-sm text-neutral-500">No worker runs recorded.</p>
        ) : (
          <div className="mb-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Gen</th>
                  <th className="py-2 pr-4">Pub</th>
                  <th className="py-2 pr-4">Fail</th>
                  <th className="py-2 pr-4">Trigger</th>
                  <th className="py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.worker.recentRuns.map((run) => (
                  <tr key={run.runId} className="border-b border-neutral-100">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {formatDate(run.startedAt)}
                    </td>
                    <td className="py-2 pr-4">{run.status}</td>
                    <td className="py-2 pr-4">{run.demosGenerated}</td>
                    <td className="py-2 pr-4">{run.demosPublished}</td>
                    <td className="py-2 pr-4">{run.demosFailed}</td>
                    <td className="py-2 pr-4">{run.triggerSource}</td>
                    <td className="py-2 max-w-xs truncate text-red-700">
                      {run.error ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 className="mb-2 text-sm font-semibold text-neutral-700">
          Generation locks
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {["generating", "generated", "published", "failed"].map((status) => (
            <StatCard
              key={status}
              label={status}
              value={String(snapshot.generationLocks[status] ?? 0)}
            />
          ))}
          <StatCard
            label="stale generating"
            value={String(snapshot.generationLocks.staleGenerating)}
          />
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Customer publishing</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Waiting onboarding"
            value={String(snapshot.customerPublish.waitingOnboarding)}
          />
          <StatCard
            label="Waiting approval"
            value={String(snapshot.customerPublish.waitingApproval)}
          />
          <StatCard
            label="Queued for publish"
            value={String(snapshot.customerPublish.queuedForPublish)}
          />
          <StatCard
            label="Publishing"
            value={String(snapshot.customerPublish.publishing)}
          />
          <StatCard
            label="Publish failed"
            value={String(snapshot.customerPublish.publishFailed)}
          />
          <StatCard
            label="Stuck publishing"
            value={String(snapshot.customerPublish.stuckPublishing)}
          />
          <StatCard
            label="Last live publish"
            value={formatDate(snapshot.customerPublish.lastSuccessfulPublishAt)}
          />
          <StatCard
            label="Active leases"
            value={String(snapshot.customerPublish.activeLeases)}
          />
        </div>

        {snapshot.customerPublish.publishFailedRows.length > 0 && (
          <>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">
              Publish failures
            </h3>
            <ul className="mb-4 space-y-2 text-sm">
              {snapshot.customerPublish.publishFailedRows.map((row) => (
                <li
                  key={row.slug}
                  className="rounded-md border border-red-100 bg-red-50 px-3 py-2"
                >
                  <Link
                    href={`/admin/leads/${row.slug}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {row.slug}
                  </Link>
                  <span className="text-neutral-500">
                    {" "}
                    · {formatDate(row.updatedAt)}
                  </span>
                  {row.publishError && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-red-700">
                        Error details
                      </summary>
                      <p className="mt-1 text-red-800">{row.publishError}</p>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {snapshot.customerPublish.activeLeaseRows.length > 0 && (
          <>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">
              Active publish leases
            </h3>
            <ul className="space-y-1 text-sm">
              {snapshot.customerPublish.activeLeaseRows.map((lease) => (
                <li key={lease.slug}>
                  <Link
                    href={`/admin/leads/${lease.slug}`}
                    className="text-blue-700 hover:underline"
                  >
                    {lease.slug}
                  </Link>{" "}
                  · {lease.status} · expires {formatDate(lease.expiresAt)}
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-4 text-sm text-neutral-600">
          <Link
            href="/admin/leads?pipeline=customers"
            className="text-blue-700 hover:underline"
          >
            View customers pipeline →
          </Link>
        </p>
      </section>

      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Demos</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total published"
            value={String(snapshot.demoLifecycle.totalPublished)}
          />
          <StatCard
            label="Never viewed"
            value={String(snapshot.demoLifecycle.publishedNeverViewed)}
          />
          <StatCard
            label="Viewed, not purchased"
            value={String(snapshot.demoLifecycle.viewedNotPurchased)}
          />
          <StatCard
            label="Oldest never viewed"
            value={
              snapshot.demoLifecycle.oldestNeverViewed
                ? formatDate(snapshot.demoLifecycle.oldestNeverViewed.publishedAt)
                : "—"
            }
          />
        </div>

        {snapshot.demoLifecycle.oldestGeneratedUnpublished && (
          <p className="mb-3 text-sm text-neutral-600">
            Oldest unpublished generated demo:{" "}
            <Link
              href={`/admin/leads/${snapshot.demoLifecycle.oldestGeneratedUnpublished.slug}`}
              className="text-blue-700 hover:underline"
            >
              {snapshot.demoLifecycle.oldestGeneratedUnpublished.slug}
            </Link>{" "}
            · {formatDate(snapshot.demoLifecycle.oldestGeneratedUnpublished.createdAt)}
          </p>
        )}

        {Object.keys(snapshot.demoLifecycle.byStatus).length > 0 && (
          <ul className="mb-3 space-y-1 text-sm text-neutral-700">
            {Object.entries(snapshot.demoLifecycle.byStatus).map(([status, count]) => (
              <li key={status}>
                {status}: {count}
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm text-neutral-600">
          <Link
            href="/admin/leads?pipeline=never_viewed"
            className="text-blue-700 hover:underline"
          >
            View never-viewed demos →
          </Link>
        </p>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">SMS / leads</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Gateway configured"
            value={boolLabel(snapshot.sms.gatewayConfigured)}
          />
          <StatCard
            label="Sent today"
            value={`${snapshot.sms.sentToday} / ${snapshot.sms.dailyLimit}`}
          />
          <StatCard
            label="Queue staleness"
            value={
              snapshot.sms.queueStaleHours === null
                ? "—"
                : `${snapshot.sms.queueStaleHours.toFixed(1)}h`
            }
          />
          <StatCard
            label="Actionable / target"
            value={`${snapshot.replenish.actionable} / ${snapshot.replenish.target}`}
          />
        </div>

        {snapshot.sms.gatewayConfigured &&
          snapshot.sms.queueStaleHours !== null &&
          snapshot.sms.queueStaleHours >= snapshot.sms.queueStaleThresholdHours && (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              SMS queue may be stale — local gateway could be offline (queue
              staleness proxy only; no live modem heartbeat).
            </p>
          )}

        {Object.keys(snapshot.sms.leadStatusCounts).length > 0 && (
          <ul className="mb-3 space-y-1 text-sm text-neutral-700">
            {Object.entries(snapshot.sms.leadStatusCounts).map(([status, count]) => (
              <li key={status}>
                {status}: {count}
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm text-neutral-600">
          <Link href="/admin/leads" className="text-blue-700 hover:underline">
            View leads pipeline →
          </Link>
        </p>
      </section>
    </div>
  );
}
