type TitledItem = {
  title?: string;
  value?: string;
  label?: string;
  stat?: string;
};

/** Resolve a short display title from legacy or preferred benefit/stat fields. */
export function formatCardTitle(item: TitledItem): string {
  if (item.title?.trim()) {
    return item.title.trim();
  }

  const value = item.value ?? item.stat ?? "";
  const label = item.label ?? "";

  return `${value} ${label}`.trim();
}
