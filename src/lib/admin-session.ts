import { isDatabaseConfigured, sql } from "@/db/client";
import { ADMIN_SESSIONS_SCHEMA_SQL } from "@/db/admin-schema";
import { ADMIN_COOKIE } from "@/lib/auth";

/**
 * Single-admin ops console session policy:
 * - Absolute lifetime: 12 hours from login (hard cap).
 * - Idle timeout: 4 hours since last_seen_at.
 * - last_seen_at refresh: at most once every 5 minutes (avoids write storms).
 */
export const ADMIN_SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;
export const ADMIN_SESSION_IDLE_MS = 4 * 60 * 60 * 1000;
export const ADMIN_SESSION_LAST_SEEN_REFRESH_MS = 5 * 60 * 1000;

/** Re-export cookie name for session call sites. */
export const ADMIN_SESSION_COOKIE = ADMIN_COOKIE;
let sessionsSchemaReady: Promise<void> | null = null;

export async function ensureAdminSessionsSchema(): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!sessionsSchemaReady) {
    sessionsSchemaReady = (async () => {
      const statements = ADMIN_SESSIONS_SCHEMA_SQL.split(";")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      const db = sql();
      for (const statement of statements) {
        await db.query(statement);
      }
    })().catch((error) => {
      sessionsSchemaReady = null;
      throw error;
    });
  }

  await sessionsSchemaReady;
}

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

/** SHA-256 hex digest of the raw session token (Edge- and Node-safe). */
export async function hashAdminSessionToken(token: string): Promise<string> {
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

export type AdminSessionCookieOptions = {
  httpOnly: true;
  secure: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  expires: Date;
};

export function getAdminSessionCookieOptions(
  expiresAt: Date,
): AdminSessionCookieOptions {
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

export type CreatedAdminSession = {
  token: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
};

/**
 * Create a fresh server-side session after successful ADMIN_SECRET login.
 * Returns the plaintext token for the cookie only — never persist or log it.
 */
export async function createAdminSession(): Promise<CreatedAdminSession> {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is required for admin sessions.");
  }

  await ensureAdminSessionsSchema();

  const token = generateSessionToken();
  const tokenHash = await hashAdminSessionToken(token);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ADMIN_SESSION_ABSOLUTE_MS);
  const db = sql();

  await db`
    INSERT INTO admin_sessions (token_hash, created_at, expires_at, last_seen_at)
    VALUES (
      ${tokenHash},
      ${createdAt.toISOString()},
      ${expiresAt.toISOString()},
      ${createdAt.toISOString()}
    )
  `;

  return { token, tokenHash, createdAt, expiresAt };
}

type SessionRow = {
  token_hash: string;
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

  const expiresAt = toDate(row.expires_at);
  if (expiresAt.getTime() <= now.getTime()) {
    return false;
  }

  const lastSeenAt = toDate(row.last_seen_at);
  if (lastSeenAt.getTime() + ADMIN_SESSION_IDLE_MS <= now.getTime()) {
    return false;
  }

  return true;
}

async function touchLastSeenIfNeeded(
  tokenHash: string,
  lastSeenAt: Date,
  now: Date,
): Promise<void> {
  if (now.getTime() - lastSeenAt.getTime() < ADMIN_SESSION_LAST_SEEN_REFRESH_MS) {
    return;
  }

  const db = sql();
  await db`
    UPDATE admin_sessions
    SET last_seen_at = ${now.toISOString()}
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL
      AND last_seen_at < ${new Date(now.getTime() - ADMIN_SESSION_LAST_SEEN_REFRESH_MS).toISOString()}
  `;
}

/**
 * Validate a cookie session token against the hashed server-side store.
 * Rejects missing, unknown, expired, idle-timed-out, and revoked sessions.
 */
export async function validateAdminSessionToken(
  token: string | null | undefined,
): Promise<boolean> {
  if (!token || !isDatabaseConfigured()) {
    return false;
  }

  await ensureAdminSessionsSchema();

  const tokenHash = await hashAdminSessionToken(token);
  const db = sql();
  const rows = (await db`
    SELECT token_hash, created_at, expires_at, last_seen_at, revoked_at
    FROM admin_sessions
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `) as SessionRow[];

  const row = rows[0];
  if (!row) {
    return false;
  }

  const now = new Date();
  if (!isSessionActive(row, now)) {
    return false;
  }

  await touchLastSeenIfNeeded(tokenHash, toDate(row.last_seen_at), now);
  return true;
}

/** Revoke the session identified by the plaintext cookie token. */
export async function revokeAdminSession(
  token: string | null | undefined,
): Promise<void> {
  if (!token || !isDatabaseConfigured()) {
    return;
  }

  await ensureAdminSessionsSchema();
  const tokenHash = await hashAdminSessionToken(token);
  await revokeAdminSessionByHash(tokenHash);
}

/** Server-side revoke/delete by stored hash (ops / future admin UI). */
export async function revokeAdminSessionByHash(tokenHash: string): Promise<void> {
  if (!tokenHash || !isDatabaseConfigured()) {
    return;
  }

  await ensureAdminSessionsSchema();
  const db = sql();
  await db`
    UPDATE admin_sessions
    SET revoked_at = COALESCE(revoked_at, NOW())
    WHERE token_hash = ${tokenHash}
  `;
}

/** Hard-delete a session row by hash (cleanup / forced invalidate). */
export async function deleteAdminSessionByHash(tokenHash: string): Promise<void> {
  if (!tokenHash || !isDatabaseConfigured()) {
    return;
  }

  await ensureAdminSessionsSchema();
  const db = sql();
  await db`DELETE FROM admin_sessions WHERE token_hash = ${tokenHash}`;
}
