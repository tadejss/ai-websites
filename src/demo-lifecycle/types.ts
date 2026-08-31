export const DEMO_LIFECYCLE_STATUSES = [
  "generated",
  "published",
  "viewed",
  "purchased",
] as const;

export type DemoLifecycleStatus = (typeof DEMO_LIFECYCLE_STATUSES)[number];

export function isDemoLifecycleStatus(
  value: string,
): value is DemoLifecycleStatus {
  return (DEMO_LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

export type DemoLifecycleRecord = {
  slug: string;
  lifecycleStatus: DemoLifecycleStatus;
  createdAt: string;
  publishedAt: string | null;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  viewCount: number;
  purchasedAt: string | null;
  updatedAt: string;
};

/** Published demo with zero meaningful views and not purchased. */
export function isNeverViewedDemo(
  record: DemoLifecycleRecord | null | undefined,
  isCustomer: boolean,
): boolean {
  if (!record || isCustomer) {
    return false;
  }

  return (
    record.lifecycleStatus === "published" &&
    record.viewCount === 0 &&
    record.firstViewedAt === null
  );
}

export function demoAgeDays(
  record: DemoLifecycleRecord | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (!record) {
    return null;
  }

  const anchor = record.publishedAt ?? record.createdAt;
  if (!anchor) {
    return null;
  }

  const ms = nowMs - new Date(anchor).getTime();
  if (ms < 0) {
    return 0;
  }

  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function lifecycleStatusLabel(status: DemoLifecycleStatus): string {
  switch (status) {
    case "generated":
      return "GENERATED";
    case "published":
      return "PUBLISHED";
    case "viewed":
      return "VIEWED";
    case "purchased":
      return "PURCHASED";
    default:
      return String(status).toUpperCase();
  }
}
