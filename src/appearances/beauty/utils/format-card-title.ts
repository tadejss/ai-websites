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
