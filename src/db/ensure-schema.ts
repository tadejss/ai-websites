import { isDatabaseConfigured, sql } from "./client";
import { CUSTOMER_SCHEMA_SQL, SMS_SCHEMA_SQL } from "./schema";

let schemaReady: Promise<void> | null = null;

/**
 * Idempotent schema bootstrap for serverless. Safe to call on every request;
 * runs CREATE TABLE / INDEX IF NOT EXISTS once per cold start.
 */
export async function ensureCustomerSchema(): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!schemaReady) {
    schemaReady = (async () => {
      const statements = `${CUSTOMER_SCHEMA_SQL};\n${SMS_SCHEMA_SQL}`.split(";")
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
