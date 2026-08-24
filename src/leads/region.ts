export const NOTRANJSKA_REGION = "notranjska";

/** Towns and municipalities treated as Notranjska for this run. Kozina is excluded. */
const NOTRANJSKA_PLACE_PATTERN =
  /postojna|cerknica|pivka|ilirska\s+bistrica|bloke|loška\s+dolina|loska\s+dolina|rakek|unec|prestranek|stari\s+trg|knežak|knezak|notranjska|hruševje|hrusevje|begunje\s+pri\s+cerknici/i;

export const NOTRANJSKA_LOCATION_BIAS = {
  latitude: 45.7757,
  longitude: 14.2136,
  radiusMeters: 35_000,
};

export function isNotranjskaAddress(address: string | undefined): boolean {
  return NOTRANJSKA_PLACE_PATTERN.test(address ?? "");
}

export function matchesRegion(
  region: string | undefined,
  address: string | undefined,
): boolean {
  if (!region) {
    return true;
  }

  if (region === NOTRANJSKA_REGION) {
    return isNotranjskaAddress(address);
  }

  return true;
}
