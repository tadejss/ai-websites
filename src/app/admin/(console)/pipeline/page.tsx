import { getPipelineKanban } from "@/admin/pipeline";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { Badge } from "@/components/admin/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminPipelinePage() {
  const columns = await getPipelineKanban();

  return (
    <div>
      <AdminPageHeader
        title="Pipeline"
        description="Onboarding kanban — open a card for the journey"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
        {columns.map((column) => (
          <div
            key={column.status}
            className="flex min-w-0 flex-col rounded-[var(--admin-radius)] border border-white/15 bg-white/[0.03]"
          >
              <div
                className={
                  column.cards.length === 0
                    ? "px-3 py-2"
                    : "border-b border-[var(--admin-border)] px-3 py-2"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 text-xs font-semibold uppercase leading-tight tracking-widest text-[var(--admin-muted)]">
                    {column.label}
                  </span>
                  <Badge variant="default">{column.cards.length}</Badge>
                </div>
              </div>
              {column.cards.length > 0 ? (
                <div className="flex-1 space-y-2 p-2">
                  {column.cards.slice(0, 20).map((card) => (
                    <Link
                      key={card.slug}
                      href={`/admin/e/${card.slug}`}
                      className="block rounded-2xl border border-white/15 bg-black p-3 transition-colors hover:border-[var(--admin-accent)]/40"
                    >
                      <div className="break-words text-base font-medium leading-snug">
                        {card.companyName}
                      </div>
                      <div className="mt-1 truncate font-mono text-xs text-[var(--admin-muted)]">
                        {card.slug}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
        ))}
      </div>
    </div>
  );
}
