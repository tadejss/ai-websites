import { isDatabaseConfigured, sql } from "@/db/client";
import { SECURITY_SCHEMA_SQL } from "@/db/security-schema";

let securitySchemaReady: Promise<void> | null = null;

async function securitySchemaLooksPresent(): Promise<boolean> {
  try {
    const db = sql();
    const rows = (await db`
      SELECT (
        to_regclass('public.rate_limit_buckets') IS NOT NULL
        AND to_regclass('public.onboarding_sessions') IS NOT NULL
      ) AS ok
    `) as Array<{ ok: boolean }>;
    return Boolean(rows[0]?.ok);
  } catch {
    return false;
  }
}

/** Idempotent bootstrap for onboarding sessions + rate-limit tables. */
export async function ensureSecuritySchema(): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!securitySchemaReady) {
    securitySchemaReady = (async () => {
      if (await securitySchemaLooksPresent()) {
        return;
      }
      const statements = SECURITY_SCHEMA_SQL.split(";")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      const db = sql();
      for (const statement of statements) {
        await db.query(statement);
      }
    })().catch((error) => {
      securitySchemaReady = null;
      throw error;
    });
  }

  await securitySchemaReady;
}
