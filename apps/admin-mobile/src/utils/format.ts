export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("sl-SI");
}

export function stageLabel(stage: string): string {
  return stage.replaceAll("_", " ").toUpperCase();
}
