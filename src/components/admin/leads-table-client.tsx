"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  AdminBulkSmsButton,
  LeadRowCheckbox,
} from "@/components/admin/leads-bulk";
import { Badge } from "@/components/admin/ui/badge";

type Row = {
  slug: string;
  companyName: string;
  industry: string | null;
  displayStatus: string;
  phone: string | null;
  smsStatus: string;
  viewCount: string;
  demoAge: string;
  isNeverViewed: boolean;
  qaStatus: string | null;
  qaPolicy: string | null;
  qaScore: number | null;
};

function QaBadge({ row }: { row: Row }) {
  if (!row.qaStatus) {
    return <span className="text-[var(--admin-muted)]">—</span>;
  }
  if (row.qaStatus === "failed" || row.qaPolicy === "fail") {
    return <Badge variant="destructive">QA fail</Badge>;
  }
  if (row.qaPolicy === "warning") {
    return (
      <Badge variant="warning">
        QA {row.qaScore != null ? row.qaScore : "warn"}
      </Badge>
    );
  }
  if (row.qaPolicy === "pass") {
    return (
      <Badge variant="success">
        QA {row.qaScore != null ? row.qaScore : "ok"}
      </Badge>
    );
  }
  if (row.qaStatus === "pending" || row.qaStatus === "running") {
    return <Badge variant="default">QA…</Badge>;
  }
  return <span className="text-[var(--admin-muted)]">—</span>;
}

function LeadCard({
  row,
  selected,
  onToggle,
}: {
  row: Row;
  selected: boolean;
  onToggle: (slug: string) => void;
}) {
  return (
    <div className="rounded-[var(--admin-radius)] border border-white/15 bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        <LeadRowCheckbox slug={row.slug} selected={selected} onToggle={onToggle} />
        <div className="min-w-0 flex-1 overflow-hidden">
          <Link
            href={`/admin/e/${row.slug}`}
            className="block break-words text-base font-medium leading-snug text-[var(--admin-accent)] hover:underline"
          >
            {row.companyName || row.slug}
          </Link>
          {row.industry ? (
            <p className="mt-0.5 text-sm text-[var(--admin-muted)]">{row.industry}</p>
          ) : null}
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-[var(--admin-muted)]">Status</dt>
              <dd>{row.displayStatus}</dd>
            </div>
            <div>
              <dt className="text-[var(--admin-muted)]">QA</dt>
              <dd>
                <QaBadge row={row} />
              </dd>
            </div>
            <div>
              <dt className="text-[var(--admin-muted)]">Views</dt>
              <dd className={row.isNeverViewed ? "font-semibold text-amber-400" : ""}>
                {row.viewCount}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--admin-muted)]">Demo age</dt>
              <dd>{row.demoAge}</dd>
            </div>
          </dl>
          <a
            href={`/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm text-[var(--admin-accent)] hover:underline"
          >
            Open demo ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export function AdminLeadsTableClient({ rows }: { rows: Row[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const slugs = rows.map((row) => row.slug);

  const toggle = useCallback((slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.length === slugs.length ? [] : [...slugs]));
  }, [slugs]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--admin-radius)] border border-white/15 bg-white/[0.03] px-4 py-3">
        <label className="flex min-h-[44px] items-center gap-2 text-base touch-manipulation">
          <input
            type="checkbox"
            checked={selected.length === slugs.length && slugs.length > 0}
            onChange={toggleAll}
            className="h-5 w-5 rounded border-[var(--admin-border)]"
          />
          Select page ({selected.length})
        </label>
        <AdminBulkSmsButton slugs={selected} />
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <LeadCard
            key={row.slug}
            row={row}
            selected={selected.includes(row.slug)}
            onToggle={toggle}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-[var(--admin-radius)] border border-white/15 md:block">
        <table className="min-w-full text-base">
          <thead>
            <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] text-xs uppercase tracking-widest text-[var(--admin-muted)]">
              <th className="px-3 py-2" />
              <th className="px-3 py-2 text-left">Business</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">SMS</th>
              <th className="px-3 py-2 text-left">Views</th>
              <th className="px-3 py-2 text-left">QA</th>
              <th className="px-3 py-2 text-left">Demo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.slug}
                className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-surface-elevated)]"
              >
                <td className="px-3 py-2">
                  <LeadRowCheckbox
                    slug={row.slug}
                    selected={selected.includes(row.slug)}
                    onToggle={toggle}
                  />
                </td>
                <td className="min-w-[10rem] px-3 py-2">
                  <Link
                    href={`/admin/e/${row.slug}`}
                    className="break-words font-medium text-[var(--admin-accent)] hover:underline"
                  >
                    {row.companyName || row.slug}
                  </Link>
                  {row.industry ? (
                    <div className="text-sm text-[var(--admin-muted)]">
                      {row.industry}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2">{row.displayStatus}</td>
                <td className="px-3 py-2 uppercase">{row.smsStatus}</td>
                <td
                  className={`px-3 py-2 tabular-nums ${
                    row.isNeverViewed ? "font-semibold text-amber-400" : ""
                  }`}
                >
                  {row.viewCount}
                </td>
                <td className="px-3 py-2">
                  <QaBadge row={row} />
                </td>
                <td className="px-3 py-2">
                  <a
                    href={`/${row.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[var(--admin-accent)] hover:underline"
                  >
                    Open ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
