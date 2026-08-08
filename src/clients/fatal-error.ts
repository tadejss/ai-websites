/**
 * Distinguishes failures that would repeat for every remaining business from
 * ones specific to a single business. Continuing past a broken key or an
 * exhausted quota just burns the rest of the batch.
 */
export function isFatalGenerationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return (
    /is not configured/i.test(message) ||
    /\b401\b|unauthorized|invalid api key/i.test(message) ||
    /\b429\b|rate limit|quota|exhausted/i.test(message)
  );
}
