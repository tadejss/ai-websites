import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import { ADMIN_ENTITY_INDEX_SCHEMA_SQL } from "@/db/admin-schema";
import { readAllLeads } from "@/leads/store";
import { getCustomerSlugSet } from "@/customers/store";
import { listSmsLeadStates } from "@/outreach/sms/store";
import { getDemoLifecycleBySlugs } from "@/demo-lifecycle/store";
import { getOnboardingBySlug } from "@/onboarding/store";
import {
  buildAdminLeadRows,
} from "@/admin/leads-filters";
import { resolveUnifiedStage } from "@/admin/entity";
import { clientSiteExists } from "@/leads/client-exists";

let indexSchemaReady: Promise<void> | null = null;

async function ensureEntityIndexSchema(): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!indexSchemaReady) {
    indexSchemaReady = (async () => {
      await ensureCustomerSchema();
      const statements = ADMIN_ENTITY_INDEX_SCHEMA_SQL.split(";")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      const db = sql();
      for (const statement of statements) {
        await db.query(statement);
      }
    })().catch((error) => {
      indexSchemaReady = null;
      throw error;
    });
  }

  await indexSchemaReady;
}

export async function refreshAdminEntityIndex(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }

  await ensureEntityIndexSchema();

  const customerSlugs = await getCustomerSlugSet();
  const allLeads = readAllLeads();
  const slugs = allLeads.map((lead) => lead.slug);
  const lifecycleBySlug = await getDemoLifecycleBySlugs(slugs);
  const smsStates = await listSmsLeadStates();
  const smsBySlug = new Map(smsStates.map((state) => [state.slug, state]));

  const rows = buildAdminLeadRows(
    allLeads,
    customerSlugs,
    smsBySlug,
    lifecycleBySlug,
  );

  const db = sql();
  let updated = 0;

  for (const row of rows) {
    const onboarding = row.isCustomer
      ? await getOnboardingBySlug(row.lead.slug)
      : null;
    const stage = resolveUnifiedStage({
      isCustomer: row.isCustomer,
      onboardingStatus: onboarding?.status ?? null,
      lifecycle: row.lifecycle,
      hasClientSite: clientSiteExists(row.lead.slug),
    });
    const sms = smsBySlug.get(row.lead.slug);
    const lastActivity =
      row.lifecycle?.lastViewedAt ??
      row.lifecycle?.publishedAt ??
      onboarding?.updatedAt ??
      null;

    await db`
      INSERT INTO admin_entity_index (
        slug, company_name, phone, unified_stage, is_customer,
        sms_status, view_count, demo_age_days, last_activity_at, updated_at
      ) VALUES (
        ${row.lead.slug},
        ${row.lead.companyName ?? row.lead.slug},
        ${row.lead.phone ?? null},
        ${stage},
        ${row.isCustomer},
        ${sms?.smsStatus ?? null},
        ${row.lifecycle?.viewCount ?? 0},
        ${row.demoAgeDays},
        ${lastActivity},
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        phone = EXCLUDED.phone,
        unified_stage = EXCLUDED.unified_stage,
        is_customer = EXCLUDED.is_customer,
        sms_status = EXCLUDED.sms_status,
        view_count = EXCLUDED.view_count,
        demo_age_days = EXCLUDED.demo_age_days,
        last_activity_at = EXCLUDED.last_activity_at,
        updated_at = NOW()
    `;
    updated += 1;
  }

  return updated;
}
