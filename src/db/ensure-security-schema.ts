import { isDatabaseConfigured, sql } from "@/db/client";
import { SECURITY_SCHEMA_SQL } from "@/db/security-schema";

let securitySchemaReady: Promise<void> | null = null;

/** Idempotent bootstrap for onboarding sessions + rate-limit tables. */
export async function ensureSecuritySchema(): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!securitySchemaReady) {
    securitySchemaReady = (async () => {
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
