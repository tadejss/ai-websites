import { APPEARANCE_IDS, type AppearanceId } from "./types";

export function resolveAppearance(value: string | undefined): AppearanceId {
  if (value && (APPEARANCE_IDS as readonly string[]).includes(value)) {
    return value as AppearanceId;
  }

  return "default";
}
