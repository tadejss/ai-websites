"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  AdminBulkSmsButton,
  LeadRowCheckbox,
} from "@/components/admin/leads-bulk";

type Row = {
  slug: string;
  companyName: string;
  industry: string | null;
  displayStatus: string;
  phone: string | null;
  smsStatus: string;
  smsSentAt: string | null;
  smsError: string | null;
  viewCount: string;
  firstView: string;
  lastView: string;
  demoAge: string;
  email: string | null;
  isNeverViewed: boolean;
};

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
    <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
      <div className="flex items-start gap-3">
        <LeadRowCheckbox slug={row.slug} selected={selected} onToggle={onToggle} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/e/${row.slug}`}
            className="block font-medium text-cyan-400 hover:underline"
          >
            {row.companyName}
          </Link>
          {row.industry ? (
            <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{row.industry}</p>
          ) : null}
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-[var(--admin-muted)]">Status</dt>
              <dd>{row.displayStatus}</dd>
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
            <div>
              <dt className="text-[var(--admin-muted)]">Phone</dt>
              <dd className="font-mono">{row.phone ?? "—"}</dd>
            </div>
          </dl>
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
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
        <label className="flex min-h-[44px] items-center gap-2 text-sm touch-manipulation">
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

      <div className="hidden overflow-x-auto rounded-lg border border-[var(--admin-border)] md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] text-[10px] uppercase tracking-widest text-[var(--admin-muted)]">
              <th className="px-3 py-2" />
              <th className="px-3 py-2 text-left">Business</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">SMS</th>
              <th className="px-3 py-2 text-left">Views</th>
              <th className="px-3 py-2 text-left">Demo age</th>
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
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/e/${row.slug}`}
                    className="font-medium text-cyan-400 hover:underline"
                  >
                    {row.companyName}
                  </Link>
                  {row.industry ? (
                    <div className="text-xs text-[var(--admin-muted)]">
                      {row.industry}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2">{row.displayStatus}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.phone ?? "—"}</td>
                <td className="px-3 py-2 uppercase">{row.smsStatus}</td>
                <td
                  className={`px-3 py-2 tabular-nums ${
                    row.isNeverViewed ? "font-semibold text-amber-400" : ""
                  }`}
                >
                  {row.viewCount}
                </td>
                <td className="px-3 py-2 tabular-nums">{row.demoAge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
