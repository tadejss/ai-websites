import { NextResponse } from "next/server";
import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureSecuritySchema } from "@/db/ensure-security-schema";

export type RateLimitParams = {
  /** Already-hashed bucket key (never raw IP). */
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  /** Unix ms when the current window ends. */
  resetAt: number;
  retryAfterSec: number;
};

/**
 * Atomic fixed-window rate limit via Neon.
 * Concurrent requests cannot reset the counter independently.
 */
export async function checkRateLimit(
  params: RateLimitParams,
): Promise<RateLimitResult> {
  const limit = Math.max(1, Math.floor(params.limit));
  const windowMs = Math.max(1_000, Math.floor(params.windowMs));
  const now = Date.now();
  const windowEndsAt = new Date(now + windowMs);

  if (!isDatabaseConfigured()) {
    // Abuse-sensitive surfaces must not fail open without shared state.
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt: now + windowMs,
      retryAfterSec: Math.ceil(windowMs / 1000),
    };
  }

  await ensureSecuritySchema();
  const db = sql();

  const rows = (await db`
    INSERT INTO rate_limit_buckets (bucket_key, count, window_starts_at, window_ends_at)
    VALUES (
      ${params.key},
      1,
      NOW(),
      ${windowEndsAt.toISOString()}
    )
    ON CONFLICT (bucket_key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_buckets.window_ends_at <= NOW() THEN 1
        ELSE rate_limit_buckets.count + 1
      END,
      window_starts_at = CASE
        WHEN rate_limit_buckets.window_ends_at <= NOW() THEN NOW()
        ELSE rate_limit_buckets.window_starts_at
      END,
      window_ends_at = CASE
        WHEN rate_limit_buckets.window_ends_at <= NOW() THEN ${windowEndsAt.toISOString()}
        ELSE rate_limit_buckets.window_ends_at
      END
    RETURNING count, window_ends_at
  `) as Array<{ count: number; window_ends_at: Date | string }>;

  const row = rows[0];
  const count = Number(row?.count ?? limit + 1);
  const resetAt =
    row?.window_ends_at instanceof Date
      ? row.window_ends_at.getTime()
      : new Date(row?.window_ends_at ?? windowEndsAt).getTime();

  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);
  const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));

  // Best-effort cleanup of expired buckets (non-blocking path).
  if (Math.random() < 0.02) {
    void db`
      DELETE FROM rate_limit_buckets
      WHERE window_ends_at < NOW() - INTERVAL '1 hour'
    `.catch(() => undefined);
  }

  return { allowed, remaining, limit, resetAt, retryAfterSec };
}

export function rateLimitResponse(
  result: RateLimitResult,
  message = "Too many requests. Try again later.",
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}

/** Delete a bucket (tests / ops). */
export async function clearRateLimitBucket(key: string): Promise<void> {
  if (!isDatabaseConfigured() || !key) {
    return;
  }
  await ensureSecuritySchema();
  const db = sql();
  await db`DELETE FROM rate_limit_buckets WHERE bucket_key = ${key}`;
}
