import type { AdminPipelineView } from "@/admin/leads-filters";

export type SavedView = {
  id: string;
  label: string;
  pipeline?: AdminPipelineView;
  status?: string;
  outreach?: string;
  q?: string;
  sort?: "company" | "demo_age" | "views" | "activity";
  columnPreset?: "pipeline" | "sms" | "lifecycle" | "customer";
};

export const ADMIN_SAVED_VIEWS: SavedView[] = [
  {
    id: "never-viewed-7d",
    label: "Never viewed 7d+",
    pipeline: "never_viewed",
    sort: "demo_age",
    columnPreset: "lifecycle",
  },
  {
    id: "sms-failed-today",
    label: "SMS failed today",
    pipeline: "actionable",
    status: "sms_failed",
    columnPreset: "sms",
  },
  {
    id: "onboarding-stuck-3d",
    label: "Onboarding stuck",
    pipeline: "customers",
    columnPreset: "customer",
  },
  {
    id: "all-actionable",
    label: "All actionable",
    pipeline: "actionable",
    columnPreset: "pipeline",
  },
];

export function resolveSavedView(id: string | undefined): SavedView | null {
  if (!id) return null;
  return ADMIN_SAVED_VIEWS.find((view) => view.id === id) ?? null;
}

export function savedViewHref(view: SavedView): string {
  const params = new URLSearchParams();
  params.set("view", view.id);
  if (view.pipeline) params.set("pipeline", view.pipeline);
  if (view.status) params.set("status", view.status);
  if (view.outreach) params.set("outreach", view.outreach);
  if (view.q) params.set("q", view.q);
  if (view.sort) params.set("sort", view.sort);
  return `/admin/leads?${params.toString()}`;
}
