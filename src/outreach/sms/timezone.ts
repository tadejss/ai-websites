/** Europe/Ljubljana wall-clock helpers for SMS campaign scheduling. */

export const SMS_TZ = "Europe/Ljubljana";

const LJUBLJANA_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: SMS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const LJUBLJANA_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: SMS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export type LjubljanaWallTime = {
  localDate: string;
  hour: number;
  minute: number;
  second: number;
};

/** Calendar date YYYY-MM-DD in Europe/Ljubljana. */
export function ljubljanaLocalDate(now: Date = new Date()): string {
  return LJUBLJANA_DATE_FORMAT.format(now);
}

export function ljubljanaWallTime(now: Date = new Date()): LjubljanaWallTime {
  const parts = LJUBLJANA_PARTS.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";
  return {
    localDate: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number.parseInt(get("hour"), 10),
    minute: Number.parseInt(get("minute"), 10),
    second: Number.parseInt(get("second"), 10),
  };
}

/**
 * Inclusive start of the outbound send / enqueue window: 09:13 local.
 * Catch-up later the same day is allowed.
 */
export function isSmsSendWindowOpen(now: Date = new Date()): boolean {
  const { hour, minute } = ljubljanaWallTime(now);
  if (hour > 9) {
    return true;
  }
  if (hour < 9) {
    return false;
  }
  return minute >= 13;
}

/** Add days to a YYYY-MM-DD calendar label (no timezone). */
export function addLocalDateDays(localDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) {
    throw new Error(`Invalid localDate: ${localDate}`);
  }
  const utc = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]) + days,
    ),
  );
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Instant bounds [start, end) for a Ljubljana calendar date.
 * Scans a wide UTC window and picks first/last matching second.
 */
export function ljubljanaDayUtcBounds(localDate: string): {
  start: Date;
  end: Date;
} {
  const next = addLocalDateDays(localDate, 1);
  const start = firstInstantOnLocalDate(localDate);
  const end = firstInstantOnLocalDate(next);
  return { start, end };
}

function firstInstantOnLocalDate(localDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) {
    throw new Error(`Invalid localDate: ${localDate}`);
  }
  // Ljubljana is UTC+1 or +2; start search from previous UTC midnight.
  let ms = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]) - 1,
    20,
    0,
    0,
  );
  const limit = ms + 36 * 60 * 60 * 1000;
  while (ms < limit) {
    const wall = ljubljanaWallTime(new Date(ms));
    if (
      wall.localDate === localDate &&
      wall.hour === 0 &&
      wall.minute === 0 &&
      wall.second === 0
    ) {
      return new Date(ms);
    }
    ms += 1000;
  }
  throw new Error(`Could not find midnight for ${localDate} in ${SMS_TZ}`);
}
