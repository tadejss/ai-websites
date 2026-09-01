import Link from "next/link";
import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import { ONBOARDING_STATUSES, onboardingStatusLabel } from "@/onboarding/types";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { Badge } from "@/components/admin/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";

export const dynamic = "force-dynamic";

type KanbanCard = {
  slug: string;
  companyName: string;
  status: string;
  updatedAt: string;
};

const KANBAN_COLUMNS = [
  "pending",
  "in_progress",
  "submitted",
  "processing",
  "ready_for_approval",
  "approved_for_publish",
  "publishing",
  "publish_failed",
  "live",
] as const;

async function loadKanbanCards(): Promise<Record<string, KanbanCard[]>> {
  const grouped: Record<string, KanbanCard[]> = {};
  for (const status of KANBAN_COLUMNS) {
    grouped[status] = [];
  }

  if (!isDatabaseConfigured()) {
    return grouped;
  }

  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT o.slug, o.status, o.updated_at,
           o.answers->>'companyName' AS company_name,
           o.contact_name
    FROM customer_onboarding o
    ORDER BY o.updated_at DESC
    LIMIT 200
  `) as Array<{
    slug: string;
    status: string;
    updated_at: Date | string;
    company_name: string | null;
    contact_name: string | null;
  }>;

  for (const row of rows) {
    if (!grouped[row.status]) {
      grouped[row.status] = [];
    }
    grouped[row.status].push({
      slug: row.slug,
      companyName: row.company_name ?? row.contact_name ?? row.slug,
      status: row.status,
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : new Date(row.updated_at).toISOString(),
    });
  }

  return grouped;
}

export default async function AdminPipelinePage() {
  const columns = await loadKanbanCards();

  return (
    <div>
      <AdminPageHeader
        title="Onboarding Pipeline"
        description="Customer onboarding kanban — click a card to open journey"
      />

      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.filter((status) =>
          (ONBOARDING_STATUSES as readonly string[]).includes(status),
        ).map((status) => {
          const cards = columns[status] ?? [];
          return (
            <div
              key={status}
              className="flex w-56 shrink-0 flex-col rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]"
            >
              <div className="border-b border-[var(--admin-border)] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--admin-muted)]">
                    {onboardingStatusLabel(status as import("@/onboarding/types").OnboardingStatus)}
                  </span>
                  <Badge variant="default">{cards.length}</Badge>
                </div>
              </div>
              <div className="flex-1 space-y-2 p-2">
                {cards.length === 0 ? (
                  <p className="px-2 py-4 text-center text-[10px] text-[var(--admin-muted)]">
                    Empty
                  </p>
                ) : (
                  cards.map((card) => (
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
          );
        })}
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
