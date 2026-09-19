import { isDatabaseConfigured, sql } from "./client";
import {
  CUSTOMER_SCHEMA_SQL,
  DEMO_LIFECYCLE_SCHEMA_SQL,
  FACTORY_SCHEMA_SQL,
  QA_SCHEMA_SQL,
  SMS_SCHEMA_SQL,
} from "./schema";

let schemaReady: Promise<void> | null = null;

async function customerSchemaLooksPresent(): Promise<boolean> {
  try {
    const db = sql();
    // Require core markers across the combined bootstrap SQL so a partial
    // older install still runs IF NOT EXISTS DDL for missing tables.
    const rows = (await db`
      SELECT (
        to_regclass('public.customers') IS NOT NULL
        AND to_regclass('public.sms_messages') IS NOT NULL
        AND to_regclass('public.demo_lifecycle') IS NOT NULL
        AND to_regclass('public.demo_view_dedupe') IS NOT NULL
      ) AS ok
    `) as Array<{ ok: boolean }>;
    return Boolean(rows[0]?.ok);
  } catch {
    return false;
  }
}

/**
 * Idempotent schema bootstrap for serverless.
 * Skips DDL when core tables already exist (one cheap check per cold isolate).
 */
export async function ensureCustomerSchema(): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!schemaReady) {
    schemaReady = (async () => {
      if (await customerSchemaLooksPresent()) {
        return;
      }

      const statements =
        `${CUSTOMER_SCHEMA_SQL};\n${SMS_SCHEMA_SQL};\n${FACTORY_SCHEMA_SQL};\n${DEMO_LIFECYCLE_SCHEMA_SQL};\n${QA_SCHEMA_SQL}`
          .split(";")
          .map((part) => part.trim())
          .filter((part) => part.length > 0);

      const db = sql();
      for (const statement of statements) {
        await db.query(statement);
      }
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  await schemaReady;
}

/** Alias for factory worker / discovery progress callers. */
export async function ensureFactorySchema(): Promise<void> {
  await ensureCustomerSchema();
}
