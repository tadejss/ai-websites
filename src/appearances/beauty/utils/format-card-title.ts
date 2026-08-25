type TitledItem = {
  title?: string;
  value?: string;
  label?: string;
  stat?: string;
};

const CONTINUATION =
  /^(in|za|do|pri|po|s|z|na|ob|od|ter|ali|iz|brez|proti|čez|cez)\b/i;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** True for numeric/metric hero stats like "10+", "4.9", "24/7". */
export function isNumericStatValue(value: string | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return false;
  }

  return /^\d/.test(trimmed) || /[%+/]/.test(trimmed);
}

/**
 * One coherent card title from benefit/stat fields.
 * Avoids gluing independent phrases like "Ambient" + "Udobje"
 * or "Dostopnost" + "Prijazne cene".
 */
export function formatCardTitle(item: TitledItem): string {
  if (item.title?.trim()) {
    return item.title.trim();
  }

  const primary = (item.value ?? item.stat ?? "").trim();
  const secondary = (item.label ?? "").trim();

  if (!primary) {
    return secondary;
  }

  if (!secondary) {
    return primary;
  }

  // "10+" + "let izkušenj", "7 dni" + "na teden"
  if (/^\d/.test(primary) || /[%+/]/.test(primary)) {
    return `${primary} ${secondary}`.trim();
  }

  // "Osebno" + "svetovanje", "Strokovnost" + "in izkušnje"
  if (
    CONTINUATION.test(secondary) ||
    /^[\p{Ll}]/u.test(secondary)
  ) {
    const joinedSecondary = CONTINUATION.test(secondary)
      ? secondary.replace(/^\S+/, (word) => word.toLocaleLowerCase("sl"))
      : secondary;
    return `${primary} ${joinedSecondary}`.trim();
  }

  // Independent phrases: prefer the fuller phrase, not a glued mashup.
  if (wordCount(secondary) >= 2 && wordCount(primary) === 1) {
    return secondary;
  }

  if (wordCount(primary) >= 2 && wordCount(secondary) === 1) {
    return primary;
  }

  if (wordCount(secondary) > wordCount(primary)) {
    return secondary;
  }

  return primary;
}

type HeroStatItem = {
  title?: string;
  value?: string;
  label?: string;
};

/**
 * Hero USP cards often split one phrase across value/label
 * ("Topel"/"Ambient", "Prijazne"/"Cene"). Join those into one title.
 * Numeric metrics keep value as the headline.
 */
export function formatHeroStatTitle(item: HeroStatItem): string {
  if (item.title?.trim()) {
    return item.title.trim();
  }

  const value = (item.value ?? "").trim();
  const label = (item.label ?? "").trim();

  if (!value) {
    return label;
  }

  if (!label || isNumericStatValue(value)) {
    return value;
  }

  const labelPart = label.replace(/^\S+/, (word) =>
    word.toLocaleLowerCase("sl"),
  );

  return `${value} ${labelPart}`.trim();
}

/** Caption under a numeric hero stat; omitted for qualitative single-title cards. */
export function formatHeroStatCaption(item: HeroStatItem): string | undefined {
  if (item.title?.trim()) {
    return undefined;
  }

  const value = (item.value ?? "").trim();
  const label = (item.label ?? "").trim();

  if (isNumericStatValue(value) && label) {
    return label;
  }

  return undefined;
}
