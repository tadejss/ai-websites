import type { PlacesLocationBias } from "@/sources/google-places-source";
import {
  getDiscoveryRegionLocationBias,
  matchesDiscoveryRegion,
} from "./discovery-regions";

export const NOTRANJSKA_REGION = "notranjska";
export const DOLENJSKA_REGION = "dolenjska";

/** Towns and municipalities treated as Notranjska for this run. Kozina is excluded. */
const NOTRANJSKA_PLACE_PATTERN =
  /postojna|cerknica|pivka|ilirska\s+bistrica|bloke|loška\s+dolina|loska\s+dolina|rakek|unec|prestranek|stari\s+trg|knežak|knezak|notranjska|hruševje|hrusevje|begunje\s+pri\s+cerknici/i;

/** Novo mesto, Krško and nearby towns (Dolenjska / Posavje corridor). */
const DOLENJSKA_PLACE_PATTERN =
  /novo\s*mesto|krško|krsko|brežice|brezice|kostanjevica|otočec|otocec|straža|straza|mirna\s+peč|mirna\s+pec|šentjernej|sentjernej|škocjan|skocjan|račja\s+vas|racja\s+vas|leskovec|raka\b|zdole|koprivnica|senovo|brestanica|drnovo|čatež|catez|globoko|dolenjske\s+toplice|žužemberk|zuzemberk|mirna\b|trebnje|mokronog|šmarješke?\s+toplice|smarjeske?\s+toplice|prečna|precna|gotna\s+vas|uršna\s+sela|ursna\s+sela|stopiče|stopice|podbočje|podbocje|krmelj|sevnica|šentjanž|sentjanz|dobruška\s+vas|dobruska|gabrje|velike\s+brusnice|veliki\s+gaber|hinje|ambrus|dvor\b|podturn|semič|semic|metlika|črnomelj|crnomelj|gradac|kočevje|kocevje|ribnica|sodražica|sodrazica|ivančna\s+gorica|ivancna\s+gorica|višnja\s+gora|visnja\s+gora|radeče|radece|laško|lasko|hrastnik|trbovlje|grosuplje/i;

export const NOTRANJSKA_LOCATION_BIAS: PlacesLocationBias = {
  latitude: 45.7757,
  longitude: 14.2136,
  radiusMeters: 35_000,
};

/** Bias around Novo mesto (Places circle radius max 50 km). */
export const DOLENJSKA_LOCATION_BIAS: PlacesLocationBias = {
  latitude: 45.8,
  longitude: 15.17,
  radiusMeters: 50_000,
};

const LEGACY_REGION_CONFIG: Record<
  string,
  { pattern: RegExp; locationBias: PlacesLocationBias }
> = {
  [NOTRANJSKA_REGION]: {
    pattern: NOTRANJSKA_PLACE_PATTERN,
    locationBias: NOTRANJSKA_LOCATION_BIAS,
  },
  [DOLENJSKA_REGION]: {
    pattern: DOLENJSKA_PLACE_PATTERN,
    locationBias: DOLENJSKA_LOCATION_BIAS,
  },
};

export function isNotranjskaAddress(address: string | undefined): boolean {
  return NOTRANJSKA_PLACE_PATTERN.test(address ?? "");
}

export function isDolenjskaAddress(address: string | undefined): boolean {
  return DOLENJSKA_PLACE_PATTERN.test(address ?? "");
}

export function getRegionLocationBias(
  region: string | undefined,
): PlacesLocationBias | undefined {
  if (!region) {
    return undefined;
  }

  const legacy = LEGACY_REGION_CONFIG[region];
  if (legacy) {
    return legacy.locationBias;
  }

  return getDiscoveryRegionLocationBias(region);
}

export function matchesRegion(
  region: string | undefined,
  address: string | undefined,
): boolean {
  if (!region) {
    return true;
  }

  const legacy = LEGACY_REGION_CONFIG[region];
  if (legacy) {
    return legacy.pattern.test(address ?? "");
  }

  return matchesDiscoveryRegion(region, address);
}
