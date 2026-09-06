/**
 * P0 security regression tests: admin sessions, cron fail-closed, slug validation.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { isDatabaseConfigured, sql } from "../src/db/client";
import {
  ADMIN_COOKIE,
  getAdminSecret,
  isValidAdminToken,
  isValidCronToken,
  readBearerToken,
} from "../src/lib/auth";
import {
  ADMIN_SESSION_ABSOLUTE_MS,
  ADMIN_SESSION_IDLE_MS,
  createAdminSession,
  deleteAdminSessionByHash,
  ensureAdminSessionsSchema,
  getAdminSessionCookieOptions,
  hashAdminSessionToken,
  revokeAdminSession,
  validateAdminSessionToken,
} from "../src/lib/admin-session";
import { isValidCustomerSlug } from "../src/lib/customer-slug";

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

function testCookieNameAndOptions(): void {
  console.log("\nAdmin session cookie");
  ok("uses __Host- prefix", ADMIN_COOKIE.startsWith("__Host-"));
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_ABSOLUTE_MS);
  const options = getAdminSessionCookieOptions(expiresAt);
  ok("httpOnly", options.httpOnly === true);
  ok("secure (required for __Host-)", options.secure === true);
  ok("sameSite lax", options.sameSite === "lax");
  ok("path /", options.path === "/");
  ok("maxAge positive", options.maxAge > 0);
  ok("idle timeout documented (4h)", ADMIN_SESSION_IDLE_MS === 4 * 60 * 60 * 1000);
  ok(
    "absolute lifetime documented (12h)",
    ADMIN_SESSION_ABSOLUTE_MS === 12 * 60 * 60 * 1000,
  );
}

function testAdminSecretLoginGate(): void {
  console.log("\nADMIN_SECRET login gate");
  const previous = process.env.ADMIN_SECRET;
  process.env.ADMIN_SECRET = "test-admin-secret-value";

  ok("correct secret accepted for login", isValidAdminToken("test-admin-secret-value"));
  ok("wrong password rejected", !isValidAdminToken("wrong-password"));
  ok("empty password rejected", !isValidAdminToken(""));
  ok("null password rejected", !isValidAdminToken(null));

  process.env.ADMIN_SECRET = previous;
}

function testCronFailClosed(): void {
  console.log("\nCron fail-closed (isValidCronToken)");
  const previous = process.env.CRON_SECRET;

  delete process.env.CRON_SECRET;
  ok("missing CRON_SECRET rejects any token", !isValidCronToken("anything"));
  ok("missing CRON_SECRET rejects null", !isValidCronToken(null));

  process.env.CRON_SECRET = "cron-test-secret";
  ok("missing Authorization token rejected", !isValidCronToken(null));
  ok("invalid Authorization token rejected", !isValidCronToken("wrong"));
  ok("valid Authorization token accepted", isValidCronToken("cron-test-secret"));
  ok(
    "Bearer parse works",
    readBearerToken("Bearer cron-test-secret") === "cron-test-secret",
  );

  if (previous === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = previous;
  }
}

async function testCronRouteRejectsWithoutExecuting(): Promise<void> {
  console.log("\nCron route refresh-admin-index");
  const previous = process.env.CRON_SECRET;
  const { GET } = await import("../src/app/api/cron/refresh-admin-index/route");

  try {
    delete process.env.CRON_SECRET;
    const missingSecret = await GET(
      new Request("http://localhost/api/cron/refresh-admin-index"),
    );
    const missingSecretBody = (await missingSecret.json()) as { error?: string };
    ok("missing CRON_SECRET => 401", missingSecret.status === 401);
    ok(
      "missing CRON_SECRET => unauthorized body",
      missingSecretBody.error === "Unauthorized",
    );

    process.env.CRON_SECRET = "cron-route-secret";
    const missingAuth = await GET(
      new Request("http://localhost/api/cron/refresh-admin-index"),
    );
    ok("missing Authorization => 401", missingAuth.status === 401);

    const invalidAuth = await GET(
      new Request("http://localhost/api/cron/refresh-admin-index", {
        headers: { authorization: "Bearer wrong" },
      }),
    );
    ok("invalid Authorization => 401", invalidAuth.status === 401);

    let validStatus: number | null = null;
    let validError: unknown = null;
    try {
      const validAuth = await GET(
        new Request("http://localhost/api/cron/refresh-admin-index", {
          headers: { authorization: "Bearer cron-route-secret" },
        }),
      );
      validStatus = validAuth.status;
    } catch (error) {
      // Auth gate passed; Next revalidateTag may throw outside a request context.
      validError = error;
    }
    ok(
      "valid Authorization => accepted (not 401)",
      validStatus !== 401 &&
        (validStatus !== null ||
          (validError instanceof Error &&
            !/unauthorized/i.test(validError.message))),
    );
  } finally {
    if (previous === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previous;
    }
  }
}

function testCustomerSlugValidation(): void {
  console.log("\nCustomer slug validation");
  ok("accepts simple slug", isValidCustomerSlug("acme-salon"));
  ok("accepts single token", isValidCustomerSlug("acme"));
  ok("rejects empty", !isValidCustomerSlug(""));
  ok("rejects null", !isValidCustomerSlug(null));

  const malicious = [
    "foo; touch /tmp/pwned",
    "foo && echo hacked",
    "foo$(whoami)",
    "foo`whoami`",
    "foo\nbar",
    "foo/bar",
    'foo"bar',
    "foo'bar",
    "../../foo",
    "Foo-Bar",
    "-leading",
    "trailing-",
    "has space",
  ];

  for (const value of malicious) {
    ok(`rejects ${JSON.stringify(value)}`, !isValidCustomerSlug(value));
  }
}

async function testAdminSessions(): Promise<void> {
  console.log("\nAdmin server-side sessions");

  if (!isDatabaseConfigured()) {
    console.log("  (skipped integration — no DATABASE_URL)");
    return;
  }

  const previousSecret = process.env.ADMIN_SECRET;
  process.env.ADMIN_SECRET = "p0-admin-secret-for-session-tests";

  await ensureAdminSessionsSchema();

  ok(
    "wrong password creates no session gate",
    !isValidAdminToken("not-the-secret"),
  );

  const session = await createAdminSession();
  ok("login creates session token", typeof session.token === "string" && session.token.length >= 32);
  ok(
    "cookie token is not ADMIN_SECRET",
    session.token !== process.env.ADMIN_SECRET,
  );
  ok(
    "session authenticates",
    await validateAdminSessionToken(session.token),
  );
  ok(
    "invalid session rejected",
    !(await validateAdminSessionToken("not-a-real-session-token")),
  );
  ok(
    "ADMIN_SECRET as cookie rejected",
    !(await validateAdminSessionToken(process.env.ADMIN_SECRET)),
  );

  const db = sql();
  const stored = (await db`
    SELECT token_hash FROM admin_sessions WHERE token_hash = ${session.tokenHash}
  `) as Array<{ token_hash: string }>;
  ok("session row stored by hash", stored.length === 1);
  ok(
    "plaintext token not stored as hash",
    stored[0]?.token_hash !== session.token,
  );
  ok(
    "stored hash matches SHA-256(token)",
    stored[0]?.token_hash === (await hashAdminSessionToken(session.token)),
  );

  // Expire absolutely
  await db`
    UPDATE admin_sessions
    SET expires_at = NOW() - INTERVAL '1 minute'
    WHERE token_hash = ${session.tokenHash}
  `;
  ok(
    "expired session rejected",
    !(await validateAdminSessionToken(session.token)),
  );

  // Fresh session for revoke
  const session2 = await createAdminSession();
  await revokeAdminSession(session2.token);
  ok(
    "revoked session rejected",
    !(await validateAdminSessionToken(session2.token)),
  );

  // Idle timeout
  const session3 = await createAdminSession();
  await db`
    UPDATE admin_sessions
    SET last_seen_at = NOW() - INTERVAL '5 hours'
    WHERE token_hash = ${session3.tokenHash}
  `;
  ok(
    "idle-expired session rejected",
    !(await validateAdminSessionToken(session3.token)),
  );

  // Bearer admin auth still works (token compare), independent of sessions
  ok(
    "Bearer ADMIN_SECRET still valid",
    isValidAdminToken(process.env.ADMIN_SECRET),
  );

  // Cleanup
  await deleteAdminSessionByHash(session.tokenHash);
  await deleteAdminSessionByHash(session2.tokenHash);
  await deleteAdminSessionByHash(session3.tokenHash);

  // Ensure sensitive values did not appear in captured logs during this section
  const joined = logLines.join("\n");
  ok(
    "ADMIN_SECRET not in logs",
    !joined.includes("p0-admin-secret-for-session-tests"),
  );
  ok("session token not in logs", !joined.includes(session.token));
  ok("session2 token not in logs", !joined.includes(session2.token));

  if (previousSecret === undefined) {
    delete process.env.ADMIN_SECRET;
  } else {
    process.env.ADMIN_SECRET = previousSecret;
  }
}

async function testAllCronRoutesUseSharedHelper(): Promise<void> {
  console.log("\nCron routes use shared isValidCronToken");
  const fs = await import("node:fs");
  const path = await import("node:path");
  const cronDir = path.join(process.cwd(), "src/app/api/cron");
  const routes = fs
    .readdirSync(cronDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(cronDir, entry.name, "route.ts"));

  ok("found cron routes", routes.length >= 1);

  for (const routePath of routes) {
    const source = fs.readFileSync(routePath, "utf8");
    const name = path.basename(path.dirname(routePath));
    ok(`${name} imports isValidCronToken`, source.includes("isValidCronToken"));
    ok(
      `${name} does not fail-open on missing secret`,
      !/if\s*\(\s*cronSecret\s*&&/.test(source),
    );
    if (name === "refresh-admin-index") {
      const authIdx = source.indexOf("isValidCronToken");
      const workIdx = source.indexOf("refreshAdminEntityIndex()");
      ok(
        "refresh-admin-index checks auth before work",
        authIdx >= 0 && workIdx > authIdx,
      );
    }
  }
}

async function main(): Promise<void> {
  captureLogs();
  try {
    console.log("P0 security tests");
    console.log(`Admin secret configured: ${Boolean(getAdminSecret())}`);
    testCookieNameAndOptions();
    testAdminSecretLoginGate();
    testCronFailClosed();
    await testCronRouteRejectsWithoutExecuting();
    testCustomerSlugValidation();
    await testAdminSessions();
    await testAllCronRoutesUseSharedHelper();

    if (failures > 0) {
      console.error(`\n${failures} security test(s) failed.`);
      process.exit(1);
    }
    console.log("\nAll P0 security tests passed.");
  } finally {
    restoreLogs();
  }
}

main().catch((error) => {
  restoreLogs();
  console.error(error);
  process.exit(1);
});
