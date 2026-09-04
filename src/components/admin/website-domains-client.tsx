"use client";

import Link from "next/link";
import { Badge } from "@/components/admin/ui/badge";
import { WebsiteDomainPanel } from "@/components/admin/website-domain-panel";
import type { WebsiteDomainAdminRow } from "@/website-domains/admin-queue";

type Props = {
  rows: WebsiteDomainAdminRow[];
  focusSlug: string | null;
  focusMissing: boolean;
};

function attentionVariant(
  state: WebsiteDomainAdminRow["attentionState"],
): "destructive" | "warning" | "success" {
  switch (state) {
    case "failed":
      return "destructive";
    case "pending":
      return "warning";
    case "live":
      return "success";
  }
}

export function WebsiteDomainsClient({
  rows,
  focusSlug,
  focusMissing,
}: Props) {
  return (
    <div className="space-y-4">
      {focusMissing ? (
        <p className="rounded-[var(--admin-radius)] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Custom URL ni trenutno na voljo za{" "}
          <span className="font-mono">{focusSlug}</span>.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-4 py-8 text-center text-sm text-[var(--admin-muted)]">
          Ni strank, ki bi čakale na custom URL.
        </p>
      ) : (
        rows.map((row) => (
          <section
            key={row.slug}
            id={row.slug}
            className={
              focusSlug === row.slug
                ? "scroll-mt-24 rounded-[var(--admin-radius)] border border-[var(--admin-accent)]/40 bg-white/[0.04] p-4"
                : "rounded-[var(--admin-radius)] border border-[var(--admin-border)] p-4"
            }
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-medium text-white">{row.companyName}</h2>
                <p className="text-xs font-mono text-[var(--admin-muted)]">
                  {row.slug}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={attentionVariant(row.attentionState)}>
                  {row.attentionState}
                </Badge>
                <Link
                  href={`/admin/e/${row.slug}`}
                  className="text-xs text-[var(--admin-accent)] hover:underline"
                >
                  Entity →
                </Link>
              </div>
            </div>
            <WebsiteDomainPanel
              slug={row.slug}
              desiredDomain={row.desiredDomain}
              domains={row.domains}
            />
          </section>
        ))
      )}
    </div>
  );
}
