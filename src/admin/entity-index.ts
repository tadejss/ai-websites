import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import { ADMIN_SCHEMA_SQL } from "@/db/admin-schema";
import { readAllLeads } from "@/leads/store";
import { getCustomerSlugSet } from "@/customers/store";
import { listSmsLeadStates } from "@/outreach/sms/store";
import { getDemoLifecycleBySlugs } from "@/demo-lifecycle/store";
import { getOnboardingBySlug } from "@/onboarding/store";
import { buildAdminLeadRows } from "@/admin/leads-filters";
import { resolveUnifiedStage } from "@/admin/entity";
import { clientSiteExists } from "@/leads/client-exists";
import { isNeverViewedDemo } from "@/demo-lifecycle/types";

let adminSchemaReady: Promise<void> | null = null;

export type EntityIndexRow = {
  slug: string;
  companyName: string;
  phone: string | null;
  unifiedStage: string;
  isCustomer: boolean;
  isActionableSms: boolean;
  isNeverViewed: boolean;
  smsStatus: string | null;
  viewCount: number;
  demoAgeDays: number | null;
  lastActivityAt: string | null;
};

export async function ensureAdminSchema(): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!adminSchemaReady) {
    adminSchemaReady = (async () => {
      await ensureCustomerSchema();
      const statements = ADMIN_SCHEMA_SQL.split(";")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      const db = sql();
      for (const statement of statements) {
        await db.query(statement);
      }
    })().catch((error) => {
      adminSchemaReady = null;
      throw error;
    });
  }

  await adminSchemaReady;
}

export async function getEntityIndexCount(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }
  await ensureAdminSchema();
  const db = sql();
  const rows = (await db`SELECT COUNT(*)::int AS count FROM admin_entity_index`) as Array<{
    count: number;
  }>;
  return rows[0]?.count ?? 0;
}

export async function refreshAdminEntityIndex(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }

  await ensureAdminSchema();

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
        is_actionable_sms, is_never_viewed,
        sms_status, view_count, demo_age_days, last_activity_at, updated_at
      ) VALUES (
        ${row.lead.slug},
        ${row.lead.companyName ?? row.lead.slug},
        ${row.lead.phone ?? null},
        ${stage},
        ${row.isCustomer},
        ${row.isActionableSms},
        ${isNeverViewedDemo(row.lifecycle, row.isCustomer)},
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
        is_actionable_sms = EXCLUDED.is_actionable_sms,
        is_never_viewed = EXCLUDED.is_never_viewed,
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

export async function searchEntityIndex(
  q: string,
  limit = 15,
): Promise<EntityIndexRow[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  await ensureAdminSchema();
  const count = await getEntityIndexCount();
  if (count === 0) {
    await refreshAdminEntityIndex();
  }

  const db = sql();
  const pattern = `%${q.trim()}%`;
  const rows = (await db`
    SELECT slug, company_name, phone, unified_stage, is_customer,
           is_actionable_sms, is_never_viewed, sms_status, view_count,
           demo_age_days, last_activity_at
    FROM admin_entity_index
    WHERE slug ILIKE ${pattern}
       OR company_name ILIKE ${pattern}
       OR phone ILIKE ${pattern}
    ORDER BY last_activity_at DESC NULLS LAST
    LIMIT ${limit}
  `) as Array<Record<string, unknown>>;

  return rows.map(mapIndexRow);
}

export type EntityIndexQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  pipeline?: "actionable" | "never_viewed" | "customers" | "excluded";
  sort?: "company" | "demo_age" | "views" | "activity";
};

export async function queryEntityIndex(
  query: EntityIndexQuery,
): Promise<{ rows: EntityIndexRow[]; total: number }> {
  if (!isDatabaseConfigured()) {
    return { rows: [], total: 0 };
  }

  await ensureAdminSchema();
  const count = await getEntityIndexCount();
  if (count === 0) {
    await refreshAdminEntityIndex();
  }

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, query.pageSize ?? 50));
  const offset = (page - 1) * pageSize;
  const pipeline = query.pipeline ?? "actionable";
  const q = query.q?.trim();

  const total = await countEntityIndexFiltered(pipeline, q);

  const rows = await fetchEntityIndexPage({
    pipeline,
    q,
    sort: query.sort,
    limit: pageSize,
    offset,
  });

  return { rows, total };
}

async function countEntityIndexFiltered(
  pipeline: EntityIndexQuery["pipeline"],
  q?: string,
): Promise<number> {
  const db = sql();
  const pattern = q ? `%${q}%` : null;

  if (pipeline === "customers") {
    const rows = pattern
      ? ((await db`
          SELECT COUNT(*)::int AS count FROM admin_entity_index
          WHERE is_customer = TRUE
            AND (slug ILIKE ${pattern} OR company_name ILIKE ${pattern} OR phone ILIKE ${pattern})
        `) as Array<{ count: number }>)
      : ((await db`
          SELECT COUNT(*)::int AS count FROM admin_entity_index WHERE is_customer = TRUE
        `) as Array<{ count: number }>);
    return rows[0]?.count ?? 0;
  }

  if (pipeline === "never_viewed") {
    const rows = pattern
      ? ((await db`
          SELECT COUNT(*)::int AS count FROM admin_entity_index
          WHERE is_never_viewed = TRUE
            AND (slug ILIKE ${pattern} OR company_name ILIKE ${pattern} OR phone ILIKE ${pattern})
        `) as Array<{ count: number }>)
      : ((await db`
          SELECT COUNT(*)::int AS count FROM admin_entity_index WHERE is_never_viewed = TRUE
        `) as Array<{ count: number }>);
    return rows[0]?.count ?? 0;
  }

  if (pipeline === "excluded") {
    const rows = pattern
      ? ((await db`
          SELECT COUNT(*)::int AS count FROM admin_entity_index
          WHERE is_customer = FALSE AND is_actionable_sms = FALSE
            AND (slug ILIKE ${pattern} OR company_name ILIKE ${pattern} OR phone ILIKE ${pattern})
        `) as Array<{ count: number }>)
      : ((await db`
          SELECT COUNT(*)::int AS count FROM admin_entity_index
          WHERE is_customer = FALSE AND is_actionable_sms = FALSE
        `) as Array<{ count: number }>);
    return rows[0]?.count ?? 0;
  }

  // actionable default
  const rows = pattern
    ? ((await db`
        SELECT COUNT(*)::int AS count FROM admin_entity_index
        WHERE is_actionable_sms = TRUE
          AND (slug ILIKE ${pattern} OR company_name ILIKE ${pattern} OR phone ILIKE ${pattern})
      `) as Array<{ count: number }>)
    : ((await db`
        SELECT COUNT(*)::int AS count FROM admin_entity_index WHERE is_actionable_sms = TRUE
      `) as Array<{ count: number }>);
  return rows[0]?.count ?? 0;
}

async function fetchEntityIndexPage(input: {
  pipeline?: EntityIndexQuery["pipeline"];
  q?: string;
  sort?: EntityIndexQuery["sort"];
  limit: number;
  offset: number;
}): Promise<EntityIndexRow[]> {
  const db = sql();
  const pattern = input.q ? `%${input.q}%` : null;
  const pipeline = input.pipeline ?? "actionable";

  let rows: Array<Record<string, unknown>> = [];

  if (pipeline === "customers") {
    rows = pattern
      ? ((await db`
          SELECT slug, company_name, phone, unified_stage, is_customer,
                 is_actionable_sms, is_never_viewed, sms_status, view_count,
                 demo_age_days, last_activity_at
          FROM admin_entity_index
          WHERE is_customer = TRUE
            AND (slug ILIKE ${pattern} OR company_name ILIKE ${pattern} OR phone ILIKE ${pattern})
          ORDER BY company_name ASC
          LIMIT ${input.limit} OFFSET ${input.offset}
        `) as Array<Record<string, unknown>>)
      : ((await db`
          SELECT slug, company_name, phone, unified_stage, is_customer,
                 is_actionable_sms, is_never_viewed, sms_status, view_count,
                 demo_age_days, last_activity_at
          FROM admin_entity_index
          WHERE is_customer = TRUE
          ORDER BY company_name ASC
          LIMIT ${input.limit} OFFSET ${input.offset}
        `) as Array<Record<string, unknown>>);
  } else if (pipeline === "never_viewed") {
    rows = pattern
      ? ((await db`
          SELECT slug, company_name, phone, unified_stage, is_customer,
                 is_actionable_sms, is_never_viewed, sms_status, view_count,
                 demo_age_days, last_activity_at
          FROM admin_entity_index
          WHERE is_never_viewed = TRUE
            AND (slug ILIKE ${pattern} OR company_name ILIKE ${pattern} OR phone ILIKE ${pattern})
          ORDER BY demo_age_days DESC NULLS LAST
          LIMIT ${input.limit} OFFSET ${input.offset}
        `) as Array<Record<string, unknown>>)
      : ((await db`
          SELECT slug, company_name, phone, unified_stage, is_customer,
                 is_actionable_sms, is_never_viewed, sms_status, view_count,
                 demo_age_days, last_activity_at
          FROM admin_entity_index
          WHERE is_never_viewed = TRUE
          ORDER BY demo_age_days DESC NULLS LAST
          LIMIT ${input.limit} OFFSET ${input.offset}
        `) as Array<Record<string, unknown>>);
  } else if (pipeline === "excluded") {
    rows = pattern
      ? ((await db`
          SELECT slug, company_name, phone, unified_stage, is_customer,
                 is_actionable_sms, is_never_viewed, sms_status, view_count,
                 demo_age_days, last_activity_at
          FROM admin_entity_index
          WHERE is_customer = FALSE AND is_actionable_sms = FALSE
            AND (slug ILIKE ${pattern} OR company_name ILIKE ${pattern} OR phone ILIKE ${pattern})
          ORDER BY company_name ASC
          LIMIT ${input.limit} OFFSET ${input.offset}
        `) as Array<Record<string, unknown>>)
      : ((await db`
          SELECT slug, company_name, phone, unified_stage, is_customer,
                 is_actionable_sms, is_never_viewed, sms_status, view_count,
                 demo_age_days, last_activity_at
          FROM admin_entity_index
          WHERE is_customer = FALSE AND is_actionable_sms = FALSE
          ORDER BY company_name ASC
          LIMIT ${input.limit} OFFSET ${input.offset}
        `) as Array<Record<string, unknown>>);
  } else {
    rows = pattern
      ? ((await db`
          SELECT slug, company_name, phone, unified_stage, is_customer,
                 is_actionable_sms, is_never_viewed, sms_status, view_count,
                 demo_age_days, last_activity_at
          FROM admin_entity_index
          WHERE is_actionable_sms = TRUE
            AND (slug ILIKE ${pattern} OR company_name ILIKE ${pattern} OR phone ILIKE ${pattern})
          ORDER BY last_activity_at DESC NULLS LAST
          LIMIT ${input.limit} OFFSET ${input.offset}
        `) as Array<Record<string, unknown>>)
      : ((await db`
          SELECT slug, company_name, phone, unified_stage, is_customer,
                 is_actionable_sms, is_never_viewed, sms_status, view_count,
                 demo_age_days, last_activity_at
          FROM admin_entity_index
          WHERE is_actionable_sms = TRUE
          ORDER BY last_activity_at DESC NULLS LAST
          LIMIT ${input.limit} OFFSET ${input.offset}
        `) as Array<Record<string, unknown>>);
  }

  return rows.map(mapIndexRow);
}

function mapIndexRow(row: Record<string, unknown>): EntityIndexRow {
  const last = row.last_activity_at;
  return {
    slug: String(row.slug),
    companyName: String(row.company_name ?? row.slug),
    phone: row.phone ? String(row.phone) : null,
    unifiedStage: String(row.unified_stage),
    isCustomer: Boolean(row.is_customer),
    isActionableSms: Boolean(row.is_actionable_sms),
    isNeverViewed: Boolean(row.is_never_viewed),
    smsStatus: row.sms_status ? String(row.sms_status) : null,
    viewCount: Number(row.view_count ?? 0),
    demoAgeDays: row.demo_age_days != null ? Number(row.demo_age_days) : null,
    lastActivityAt:
      last instanceof Date
        ? last.toISOString()
        : last
          ? new Date(String(last)).toISOString()
          : null,
  };
}
