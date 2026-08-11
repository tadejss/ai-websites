import type { AppearanceId } from "./types";

const BEAUTY_KEYWORDS =
  /friz|salon|lepot|nail|noht|lash|brow|masaž|masaz|spa|wellness|kozmet|makeup|barber|hair|beauty|kozmetolog|nega\s+las|nega\s+kože/i;

export function appearanceForIndustry(industry: string): AppearanceId {
  return BEAUTY_KEYWORDS.test(industry) ? "beauty" : "default";
}
