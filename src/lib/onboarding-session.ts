import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureSecuritySchema } from "@/db/ensure-security-schema";

/**
 * Customer onboarding browser session policy:
 * - Absolute lifetime: 8 hours from exchange (hard cap).
 * - Idle timeout: 2 hours since last_seen_at.
 * - last_seen_at refresh: at most once every 5 minutes.
 *
 * The emailed access_token remains a long-lived capability used ONLY to
 * establish a session (customers reopen email links / multi-device).
 * We deliberately do NOT consume that token on exchange so already-issued
 * magic links keep working. Session cookies are short-lived and revocable.
 */
export const ONBOARDING_SESSION_ABSOLUTE_MS = 8 * 60 * 60 * 1000;
export const ONBOARDING_SESSION_IDLE_MS = 2 * 60 * 60 * 1000;
export const ONBOARDING_SESSION_LAST_SEEN_REFRESH_MS = 5 * 60 * 1000;

/** Prefer __Host- so Secure + Path=/ + no Domain are enforced by the browser. */
export const ONBOARDING_SESSION_COOKIE = "__Host-onboarding_session";

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function hashOnboardingSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return bytesToHex(digest);
}

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export type OnboardingSessionCookieOptions = {
  httpOnly: true;
  secure: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  expires: Date;
};

export function getOnboardingSessionCookieOptions(
  expiresAt: Date,
): OnboardingSessionCookieOptions {
  const maxAge = Math.max(
    0,
    Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  );
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    expires: expiresAt,
  };
}

export type CreatedOnboardingSession = {
  token: string;
  tokenHash: string;
  slug: string;
  createdAt: Date;
  expiresAt: Date;
};

/**
 * Create a fresh onboarding session bound to a customer slug.
 * Returns plaintext token for the cookie only — never persist or log it.
 */
export async function createOnboardingSession(
  slug: string,
): Promise<CreatedOnboardingSession> {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is required for onboarding sessions.");
  }
  if (!slug.trim()) {
    throw new Error("slug is required");
  }

  await ensureSecuritySchema();

  const token = generateSessionToken();
  const tokenHash = await hashOnboardingSessionToken(token);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ONBOARDING_SESSION_ABSOLUTE_MS);
  const db = sql();

  await db`
    INSERT INTO onboarding_sessions (
      token_hash, slug, created_at, expires_at, last_seen_at
    )
    VALUES (
      ${tokenHash},
      ${slug},
      ${createdAt.toISOString()},
      ${expiresAt.toISOString()},
      ${createdAt.toISOString()}
    )
  `;

  return { token, tokenHash, slug, createdAt, expiresAt };
}

type SessionRow = {
  token_hash: string;
  slug: string;
  created_at: Date | string;
  expires_at: Date | string;
  last_seen_at: Date | string;
  revoked_at: Date | string | null;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function isSessionActive(row: SessionRow, now: Date): boolean {
  if (row.revoked_at != null) {
    return false;
  }
  if (toDate(row.expires_at).getTime() <= now.getTime()) {
    return false;
  }
  if (toDate(row.last_seen_at).getTime() + ONBOARDING_SESSION_IDLE_MS <= now.getTime()) {
    return false;
  }
  return true;
}

async function touchLastSeenIfNeeded(
  tokenHash: string,
  lastSeenAt: Date,
  now: Date,
): Promise<void> {
  if (now.getTime() - lastSeenAt.getTime() < ONBOARDING_SESSION_LAST_SEEN_REFRESH_MS) {
    return;
  }

  const db = sql();
  await db`
    UPDATE onboarding_sessions
    SET last_seen_at = ${now.toISOString()}
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL
      AND last_seen_at < ${new Date(now.getTime() - ONBOARDING_SESSION_LAST_SEEN_REFRESH_MS).toISOString()}
  `;
}

export type OnboardingSessionValidation =
  | { ok: true; slug: string; tokenHash: string }
  | { ok: false; reason: "missing" | "invalid" | "expired" | "revoked" | "slug_mismatch" | "no_db" };

/**
 * Validate cookie session and enforce tenant binding to expectedSlug.
 * A session for customer A never authorizes customer B.
 */
export async function validateOnboardingSession(
  token: string | null | undefined,
  expectedSlug: string,
): Promise<OnboardingSessionValidation> {
  if (!token) {
    return { ok: false, reason: "missing" };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "no_db" };
  }

  await ensureSecuritySchema();

  const tokenHash = await hashOnboardingSessionToken(token);
  const db = sql();
  const rows = (await db`
    SELECT token_hash, slug, created_at, expires_at, last_seen_at, revoked_at
    FROM onboarding_sessions
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `) as SessionRow[];

  const row = rows[0];
  if (!row) {
    return { ok: false, reason: "invalid" };
  }

  if (row.revoked_at != null) {
    return { ok: false, reason: "revoked" };
  }

  const now = new Date();
  if (
    toDate(row.expires_at).getTime() <= now.getTime() ||
    toDate(row.last_seen_at).getTime() + ONBOARDING_SESSION_IDLE_MS <= now.getTime()
  ) {
    return { ok: false, reason: "expired" };
  }

  if (row.slug !== expectedSlug) {
    return { ok: false, reason: "slug_mismatch" };
  }

  if (!isSessionActive(row, now)) {
    return { ok: false, reason: "expired" };
  }

  await touchLastSeenIfNeeded(tokenHash, toDate(row.last_seen_at), now);
  return { ok: true, slug: row.slug, tokenHash };
}

export async function revokeOnboardingSession(
  token: string | null | undefined,
): Promise<void> {
  if (!token || !isDatabaseConfigured()) {
    return;
  }
  await ensureSecuritySchema();
  const tokenHash = await hashOnboardingSessionToken(token);
  await revokeOnboardingSessionByHash(tokenHash);
}

export async function revokeOnboardingSessionByHash(tokenHash: string): Promise<void> {
  if (!tokenHash || !isDatabaseConfigured()) {
    return;
  }
  await ensureSecuritySchema();
  const db = sql();
  await db`
    UPDATE onboarding_sessions
    SET revoked_at = COALESCE(revoked_at, NOW())
    WHERE token_hash = ${tokenHash}
  `;
}

export async function deleteOnboardingSessionByHash(tokenHash: string): Promise<void> {
  if (!tokenHash || !isDatabaseConfigured()) {
    return;
  }
  await ensureSecuritySchema();
  const db = sql();
  await db`DELETE FROM onboarding_sessions WHERE token_hash = ${tokenHash}`;
}
