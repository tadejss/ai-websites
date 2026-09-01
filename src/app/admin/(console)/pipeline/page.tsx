import { getPipelineKanban } from "@/admin/pipeline";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { Badge } from "@/components/admin/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminPipelinePage() {
  const columns = await getPipelineKanban();

  return (
    <div>
      <AdminPageHeader
        title="Onboarding Pipeline"
        description="Customer onboarding kanban — click a card to open journey"
      />

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.status}
            className="flex w-56 shrink-0 snap-start flex-col rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]"
          >
            <div className="border-b border-[var(--admin-border)] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--admin-muted)]">
                  {column.label}
                </span>
                <Badge variant="default">{column.cards.length}</Badge>
              </div>
            </div>
            <div className="flex-1 space-y-2 p-2">
              {column.cards.length === 0 ? (
                <p className="px-2 py-4 text-center text-[10px] text-[var(--admin-muted)]">
                  Empty
                </p>
              ) : (
                column.cards.map((card) => (
                  <Link
                    key={card.slug}
                    href={`/admin/e/${card.slug}`}
                    className="block rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] p-2 transition-colors hover:border-cyan-500/40"
                  >
                    <div className="text-sm font-medium">{card.companyName}</div>
                    <div className="mt-1 font-mono text-[10px] text-[var(--admin-muted)]">
                      {card.slug}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--admin-muted)]">
          Cards are read-only — state changes happen via customer flow or admin
          approve/retry on the entity journey page.
        </CardContent>
      </Card>
    </div>
  );
}
