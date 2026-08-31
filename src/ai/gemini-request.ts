import type {
  GenerateContentRequest,
  GenerateContentResult,
  GenerativeModel,
} from "@google/generative-ai";

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_MIN_REQUEST_INTERVAL_MS = 4100;
const DEFAULT_MAX_429_RETRIES = 3;

function minRequestIntervalMs(): number {
  return parsePositiveInt(
    process.env.GEMINI_MIN_REQUEST_INTERVAL_MS,
    DEFAULT_MIN_REQUEST_INTERVAL_MS,
  );
}

function max429Retries(): number {
  return parsePositiveInt(
    process.env.GEMINI_MAX_429_RETRIES,
    DEFAULT_MAX_429_RETRIES,
  );
}

/** Default ~13 RPM sustained; free tier is 15 RPM. */
export const GEMINI_MIN_REQUEST_INTERVAL_MS = DEFAULT_MIN_REQUEST_INTERVAL_MS;
export const GEMINI_MAX_429_RETRIES = DEFAULT_MAX_429_RETRIES;

const DEFAULT_429_RETRY_MS = 60_000;
const RETRY_JITTER_MS = 250;

type GeminiErrorShape = {
  status?: number;
  message?: string;
  errorDetails?: Array<{
    "@type"?: string;
    retryDelay?: string;
  }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

let requestChain: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

/** Serializes Gemini calls and enforces a minimum interval between requests. */
export async function acquireGeminiSlot(): Promise<void> {
  const next = requestChain.then(async () => {
    const waitMs = Math.max(
      0,
      lastRequestAt + minRequestIntervalMs() - Date.now(),
    );

    if (waitMs > 0) {
      await sleep(waitMs);
    }

    lastRequestAt = Date.now();
  });

  requestChain = next.catch(() => {});
  await next;
}

export function isGeminiRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return /\b429\b|rate limit|resource exhausted|quota/i.test(String(error));
  }

  const shaped = error as GeminiErrorShape;
  const message = shaped.message ?? (error instanceof Error ? error.message : "");

  return (
    shaped.status === 429
    || /\b429\b|rate limit|resource exhausted|quota exceeded/i.test(message)
  );
}

function parseDurationSeconds(value: string): number | undefined {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)s$/i);
  if (!match) {
    return undefined;
  }

  return Number.parseFloat(match[1]!);
}

/** Parses google.rpc.RetryInfo.retryDelay or message hints from Gemini 429 errors. */
export function parseGeminiRetryDelayMs(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const shaped = error as GeminiErrorShape;

    for (const detail of shaped.errorDetails ?? []) {
      if (
        detail.retryDelay
        && (detail["@type"]?.includes("RetryInfo") ?? true)
      ) {
        const seconds = parseDurationSeconds(detail.retryDelay);
        if (seconds !== undefined) {
          return Math.ceil(seconds * 1000);
        }
      }
    }
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

  const retryInfoMatch = message.match(/retryDelay["']?\s*[:=]\s*["']?(\d+(?:\.\d+)?)s/i);
  if (retryInfoMatch) {
    return Math.ceil(Number.parseFloat(retryInfoMatch[1]!) * 1000);
  }

  const retryInMatch = message.match(/retry(?: in| after)?\s*(\d+(?:\.\d+)?)\s*s/i);
  if (retryInMatch) {
    return Math.ceil(Number.parseFloat(retryInMatch[1]!) * 1000);
  }

  return undefined;
}

/**
 * Rate-limited wrapper around GenerativeModel.generateContent.
 * Proactive spacing prevents most 429s; transient 429s retry with API delay.
 */
export async function generateGeminiContent(
  model: GenerativeModel,
  request: string | GenerateContentRequest,
): Promise<GenerateContentResult> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= max429Retries(); attempt += 1) {
    await acquireGeminiSlot();

    try {
      return await model.generateContent(request);
    } catch (error) {
      lastError = error;

      if (!isGeminiRateLimitError(error) || attempt >= max429Retries()) {
        throw error;
      }

      const delayMs =
        parseGeminiRetryDelayMs(error) ?? DEFAULT_429_RETRY_MS;

      console.warn(
        `Gemini rate limit (attempt ${attempt}/${max429Retries()}); waiting ${Math.ceil((delayMs + RETRY_JITTER_MS) / 1000)}s.`,
      );
      await sleep(delayMs + RETRY_JITTER_MS);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError));
}

/** Test helper — resets in-process throttle state. */
export function resetGeminiRequestStateForTests(): void {
  requestChain = Promise.resolve();
  lastRequestAt = 0;
}
