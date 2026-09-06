/**
 * P1 security regression tests: onboarding sessions, rate limits, CSRF, headers.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { isDatabaseConfigured, sql } from "../src/db/client";
import { ensureSecuritySchema } from "../src/db/ensure-security-schema";
import {
  ONBOARDING_SESSION_COOKIE,
  createOnboardingSession,
  deleteOnboardingSessionByHash,
  getOnboardingSessionCookieOptions,
  hashOnboardingSessionToken,
  revokeOnboardingSession,
  validateOnboardingSession,
} from "../src/lib/onboarding-session";
import {
  checkRateLimit,
  clearRateLimitBucket,
  rateLimitResponse,
} from "../src/lib/rate-limit";
import { hashRateLimitMaterial } from "../src/lib/client-ip";
import {
  checkTrustedMutationOrigin,
  isTrustedMutationOrigin,
} from "../src/lib/csrf";
import {
  ADMIN_CONTENT_SECURITY_POLICY,
  BASE_SECURITY_HEADERS,
  CONTENT_SECURITY_POLICY,
  applySecurityHeaders,
} from "../src/lib/security-headers";
import { isValidAdminToken, readBearerToken } from "../src/lib/auth";
import { authorizeAdminMutation } from "../src/lib/admin-auth";

let failures = 0;
const logLines: string[] = [];
const originalLog = console.log;
const originalError = console.error;

function captureLogs(): void {
  console.log = (...args: unknown[]) => {
    logLines.push(args.map(String).join(" "));
    originalLog(...args);
  };
  console.error = (...args: unknown[]) => {
    logLines.push(args.map(String).join(" "));
    originalError(...args);
  };
}

function restoreLogs(): void {
  console.log = originalLog;
  console.error = originalError;
}

function ok(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
    originalError(`FAIL  ${label}`);
    return;
  }
  originalLog(`PASS  ${label}`);
}

function testCookieAndHeaders(): void {
  console.log("\nOnboarding cookie + security headers");
  ok("__Host-onboarding_session", ONBOARDING_SESSION_COOKIE.startsWith("__Host-"));
  const opts = getOnboardingSessionCookieOptions(
    new Date(Date.now() + 60_000),
  );
  ok("httpOnly", opts.httpOnly === true);
  ok("secure", opts.secure === true);
  ok("sameSite lax", opts.sameSite === "lax");
  ok("path /", opts.path === "/");

  ok("base headers include nosniff", BASE_SECURITY_HEADERS.some((h) => h.key === "X-Content-Type-Options"));
  ok("CSP has no unsafe-eval", !CONTENT_SECURITY_POLICY.includes("unsafe-eval"));
  ok("CSP allows stripe js", CONTENT_SECURITY_POLICY.includes("js.stripe.com"));
  ok(
    "CSP frame-src allows self for Primeri iframes",
    CONTENT_SECURITY_POLICY.includes("frame-src 'self'"),
  );
  ok("admin CSP frame-ancestors none", ADMIN_CONTENT_SECURITY_POLICY.includes("frame-ancestors 'none'"));

  const headers = new Headers();
  applySecurityHeaders(headers, { admin: true });
  ok("admin X-Frame-Options DENY", headers.get("X-Frame-Options") === "DENY");
  applySecurityHeaders(headers, { admin: false });
  ok(
    "public X-Frame-Options SAMEORIGIN",
    headers.get("X-Frame-Options") === "SAMEORIGIN",
  );
}

function testCsrf(): void {
  console.log("\nCSRF / Origin checks");
  ok(
    "same-origin allowed",
    isTrustedMutationOrigin(
      new Request("https://zbrendiraj.si/api/admin/x", {
        headers: { origin: "https://zbrendiraj.si" },
      }),
    ),
  );
  ok(
    "cross-origin rejected",
    !isTrustedMutationOrigin(
      new Request("https://zbrendiraj.si/api/admin/x", {
        headers: { origin: "https://evil.example" },
      }),
    ),
  );
  ok(
    "missing Origin rejected",
    checkTrustedMutationOrigin(
      new Request("https://zbrendiraj.si/api/admin/x"),
    ).ok === false,
  );
  ok(
    "Referer fallback accepted",
    isTrustedMutationOrigin(
      new Request("https://zbrendiraj.si/api/admin/x", {
        headers: { referer: "https://zbrendiraj.si/admin" },
      }),
    ),
  );
}

async function testRateLimit(): Promise<void> {
  console.log("\nDurable rate limiting");
  if (!isDatabaseConfigured()) {
    console.log("  (skipped — no DATABASE_URL)");
    return;
  }

  await ensureSecuritySchema();
  const key = await hashRateLimitMaterial(`test-rl:${Date.now()}:${Math.random()}`);
  await clearRateLimitBucket(key);

  const windowMs = 60_000;
  const limit = 3;
  let last = await checkRateLimit({ key, limit, windowMs });
  ok("first allowed", last.allowed);
  last = await checkRateLimit({ key, limit, windowMs });
  ok("second allowed", last.allowed);
  last = await checkRateLimit({ key, limit, windowMs });
  ok("third allowed", last.allowed);
  last = await checkRateLimit({ key, limit, windowMs });
  ok("fourth blocked", !last.allowed);
  ok("retryAfter positive", last.retryAfterSec >= 1);

  const response = rateLimitResponse(last);
  ok("429 status", response.status === 429);
  ok(
    "Retry-After header",
    response.headers.get("Retry-After") === String(last.retryAfterSec),
  );

  const otherKey = await hashRateLimitMaterial(`test-rl-other:${Date.now()}`);
  await clearRateLimitBucket(otherKey);
  const isolated = await checkRateLimit({ key: otherKey, limit, windowMs });
  ok("different keys isolated", isolated.allowed);

  const raceKey = await hashRateLimitMaterial(`test-rl-race:${Date.now()}`);
  await clearRateLimitBucket(raceKey);
  const raceLimit = 5;
  const raceResults = await Promise.all(
    Array.from({ length: 12 }, () =>
      checkRateLimit({ key: raceKey, limit: raceLimit, windowMs }),
    ),
  );
  const allowedCount = raceResults.filter((r) => r.allowed).length;
  ok(
    "concurrent requests cannot far exceed limit",
    allowedCount <= raceLimit + 2,
  );
  ok("concurrent still blocks some", allowedCount < 12);

  const slugA = await hashRateLimitMaterial(`contact:1.1.1.1:slug-a`);
  const slugB = await hashRateLimitMaterial(`contact:1.1.1.1:slug-b`);
  ok("site-specific keys differ", slugA !== slugB);

  await clearRateLimitBucket(key);
  await clearRateLimitBucket(otherKey);
  await clearRateLimitBucket(raceKey);
}

async function testOnboardingSessions(): Promise<void> {
  console.log("\nOnboarding sessions + tenant isolation");
  if (!isDatabaseConfigured()) {
    console.log("  (skipped — no DATABASE_URL)");
    return;
  }

  await ensureSecuritySchema();
  const db = sql();

  // Ensure two customer rows exist for FK (or skip if customers table empty)
  const customers = (await db`SELECT slug FROM customers LIMIT 2`) as Array<{
    slug: string;
  }>;

  if (customers.length < 2) {
    console.log("  (skipped — need ≥2 customers for cross-tenant test)");
    // Still test single-slug session lifecycle with a synthetic approach:
    // insert a temp customer if possible — skip if FK blocks
    return;
  }

  const slugA = customers[0]!.slug;
  const slugB = customers[1]!.slug;

  const session = await createOnboardingSession(slugA);
  ok("creates session token", session.token.length >= 32);
  ok(
    "cookie token is not capability-looking plaintext secret reuse",
    session.token !== slugA,
  );

  const valid = await validateOnboardingSession(session.token, slugA);
  ok("valid session can authorize slug A", valid.ok);

  const cross = await validateOnboardingSession(session.token, slugB);
  ok("session for A cannot access B", !cross.ok && cross.reason === "slug_mismatch");

  ok(
    "invalid session rejected",
    !(await validateOnboardingSession("bogus-token", slugA)).ok,
  );

  const stored = (await db`
    SELECT token_hash, slug FROM onboarding_sessions WHERE token_hash = ${session.tokenHash}
  `) as Array<{ token_hash: string; slug: string }>;
  ok("hash stored not plaintext", stored[0]?.token_hash !== session.token);
  ok(
    "hash matches",
    stored[0]?.token_hash === (await hashOnboardingSessionToken(session.token)),
  );
  ok("slug bound", stored[0]?.slug === slugA);

  await db`
    UPDATE onboarding_sessions
    SET expires_at = NOW() - INTERVAL '1 minute'
    WHERE token_hash = ${session.tokenHash}
  `;
  ok(
    "expired rejected",
    !(await validateOnboardingSession(session.token, slugA)).ok,
  );

  const session2 = await createOnboardingSession(slugA);
  await revokeOnboardingSession(session2.token);
  ok(
    "revoked rejected",
    !(await validateOnboardingSession(session2.token, slugA)).ok,
  );

  const session3 = await createOnboardingSession(slugA);
  await db`
    UPDATE onboarding_sessions
    SET last_seen_at = NOW() - INTERVAL '3 hours'
    WHERE token_hash = ${session3.tokenHash}
  `;
  ok(
    "idle expired rejected",
    !(await validateOnboardingSession(session3.token, slugA)).ok,
  );

  const joined = logLines.join("\n");
  ok("session token not logged", !joined.includes(session.token));
  ok("session2 token not logged", !joined.includes(session2.token));

  await deleteOnboardingSessionByHash(session.tokenHash);
  await deleteOnboardingSessionByHash(session2.tokenHash);
  await deleteOnboardingSessionByHash(session3.tokenHash);
}

async function testAdminAuthDistinguishesBearer(): Promise<void> {
  console.log("\nAdmin CSRF vs Bearer");
  const previous = process.env.ADMIN_SECRET;
  process.env.ADMIN_SECRET = "p1-admin-secret-for-csrf-tests";

  ok("Bearer token still validates", isValidAdminToken("p1-admin-secret-for-csrf-tests"));
  ok(
    "Bearer parse",
    readBearerToken("Bearer p1-admin-secret-for-csrf-tests") ===
      "p1-admin-secret-for-csrf-tests",
  );

  // authorizeAdminMutation with Bearer and evil Origin should still pass
  const bearerReq = new Request("https://zbrendiraj.si/api/admin/x", {
    method: "POST",
    headers: {
      authorization: "Bearer p1-admin-secret-for-csrf-tests",
      origin: "https://evil.example",
    },
  });
  ok(
    "Bearer mutation ignores Origin",
    await authorizeAdminMutation(bearerReq),
  );

  // Cookie-only without Origin should fail at authorizeAdminMutation
  // (no valid cookie either — overall false)
  const cookieReq = new Request("https://zbrendiraj.si/api/admin/x", {
    method: "POST",
    headers: { origin: "https://evil.example" },
  });
  ok(
    "cookie path with evil Origin fails",
    !(await authorizeAdminMutation(cookieReq)),
  );

  if (previous === undefined) {
    delete process.env.ADMIN_SECRET;
  } else {
    process.env.ADMIN_SECRET = previous;
  }
}

async function main(): Promise<void> {
  captureLogs();
  try {
    console.log("P1 security tests");
    testCookieAndHeaders();
    testCsrf();
    await testRateLimit();
    await testOnboardingSessions();
    await testAdminAuthDistinguishesBearer();

    if (failures > 0) {
      console.error(`\n${failures} P1 security test(s) failed.`);
      process.exit(1);
    }
    console.log("\nAll P1 security tests passed.");
  } finally {
    restoreLogs();
  }
}

main().catch((error) => {
  restoreLogs();
  console.error(error);
  process.exit(1);
});
