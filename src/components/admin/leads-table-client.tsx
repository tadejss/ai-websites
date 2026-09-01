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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.length === slugs.length && slugs.length > 0}
            onChange={toggleAll}
            className="rounded border-[var(--admin-border)]"
          />
          Select page ({selected.length})
        </label>
        <AdminBulkSmsButton slugs={selected} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--admin-border)]">
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
