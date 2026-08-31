export function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Consecutive zero-candidate queries before early combination completion. */
export const DISCOVERY_ZERO_YIELD_COMPLETION_STREAK = parsePositiveInt(
  process.env.DISCOVERY_ZERO_YIELD_COMPLETION_STREAK,
  3,
);

/** Max Text Search requests per replenish run. */
export const DISCOVERY_MAX_SEARCHES_PER_RUN = parsePositiveInt(
  process.env.DISCOVERY_MAX_SEARCHES_PER_RUN,
  80,
);

/** Full pagination per query (Google cap). */
export const DISCOVERY_PLACES_LIMIT_PER_QUERY = 60;
