import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const MAX_SEARCHES_PER_HOUR = 45;
const WINDOW_MS = 60 * 60 * 1000;
const LOG_PATH = resolve(process.cwd(), "data/.unsplash-search-times.json");

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function readTimes(): number[] {
  if (!existsSync(LOG_PATH)) {
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(LOG_PATH, "utf8")) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is number => typeof value === "number")
      : [];
  } catch {
    return [];
  }
}

function writeTimes(times: number[]): void {
  mkdirSync(dirname(LOG_PATH), { recursive: true });
  writeFileSync(LOG_PATH, `${JSON.stringify(times)}\n`, "utf8");
}

/** Wait until a search slot is free under the Unsplash ~50 request/hour cap. */
export async function acquireUnsplashSearchSlot(): Promise<void> {
  let times = readTimes().filter((time) => Date.now() - time < WINDOW_MS);

  if (times.length < MAX_SEARCHES_PER_HOUR) {
    times.push(Date.now());
    writeTimes(times);
    return;
  }

  const waitMs = WINDOW_MS - (Date.now() - times[0]) + 250;
  console.warn(
    `Unsplash throttle: ${times.length} searches in the last hour; waiting ${Math.ceil(waitMs / 1000)}s.`,
  );
  await sleep(waitMs);

  times = readTimes().filter((time) => Date.now() - time < WINDOW_MS);
  times.push(Date.now());
  writeTimes(times);
}
