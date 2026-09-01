import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import { ONBOARDING_STATUSES, onboardingStatusLabel } from "@/onboarding/types";
import type { OnboardingStatus } from "@/onboarding/types";

export type PipelineKanbanCard = {
  slug: string;
  companyName: string;
  status: string;
  updatedAt: string;
};

export type PipelineColumn = {
  status: OnboardingStatus;
  label: string;
  cards: PipelineKanbanCard[];
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
] as const satisfies readonly OnboardingStatus[];

export async function getPipelineKanban(): Promise<PipelineColumn[]> {
  const grouped: Record<string, PipelineKanbanCard[]> = {};
  for (const status of KANBAN_COLUMNS) {
    grouped[status] = [];
  }

  if (isDatabaseConfigured()) {
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
  }

  return KANBAN_COLUMNS.filter((status) =>
    (ONBOARDING_STATUSES as readonly string[]).includes(status),
  ).map((status) => ({
    status,
    label: onboardingStatusLabel(status),
    cards: grouped[status] ?? [],
  }));
}
