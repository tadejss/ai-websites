import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import type {
  AuthorizeSmsSendResult,
  SmsInboundRecord,
  SmsLeadState,
  SmsLeadStatus,
  SmsMessageRecord,
  SmsMessageStatus,
  SmsOptOutRecord,
  SmsStep,
} from "./types";

type MessageRow = {
  id: string | number;
  message_id: string;
  slug: string;
  to_phone: string;
  to_phone_raw: string | null;
  body: string;
  status: string;
  step: string;
  provider_message_id: string | null;
  last_error: string | null;
  claimed_at: Date | string | null;
  claimed_by: string | null;
  claim_expires_at: Date | string | null;
  sent_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type StateRow = {
  slug: string;
  normalized_phone: string | null;
  sms_status: string;
  sms_allowed: boolean;
  sms_sent_at: Date | string | null;
  sms_last_error: string | null;
  sms_message_id: string | null;
  sms_reply_at: Date | string | null;
  updated_at: Date | string;
};

type InboundRow = {
  id: string | number;
  provider_message_id: string | null;
  from_phone: string;
  to_phone: string | null;
  body: string;
  received_at: Date | string;
  slug: string | null;
  matched: boolean;
  is_opt_out: boolean;
  normalization_failed: boolean;
  created_at: Date | string;
};

type OptOutRow = {
  phone: string;
  source: string;
  reason: string;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapMessage(row: MessageRow): SmsMessageRecord {
  return {
    id: Number(row.id),
    messageId: row.message_id,
    slug: row.slug,
    toPhone: row.to_phone,
    toPhoneRaw: row.to_phone_raw,
    body: row.body,
    status: row.status as SmsMessageStatus,
    step: row.step as SmsStep,
    providerMessageId: row.provider_message_id,
    lastError: row.last_error,
    claimedAt: toIso(row.claimed_at),
    claimedBy: row.claimed_by,
    claimExpiresAt: toIso(row.claim_expires_at),
    sentAt: toIso(row.sent_at),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

function mapState(row: StateRow): SmsLeadState {
  return {
    slug: row.slug,
    normalizedPhone: row.normalized_phone,
    smsStatus: row.sms_status as SmsLeadStatus,
    smsAllowed: row.sms_allowed,
    smsSentAt: toIso(row.sms_sent_at),
    smsLastError: row.sms_last_error,
    smsMessageId: row.sms_message_id,
    smsReplyAt: toIso(row.sms_reply_at),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

function mapInbound(row: InboundRow): SmsInboundRecord {
  return {
    id: Number(row.id),
    providerMessageId: row.provider_message_id,
    fromPhone: row.from_phone,
    toPhone: row.to_phone,
    body: row.body,
    receivedAt: toIso(row.received_at) ?? new Date().toISOString(),
    slug: row.slug,
    matched: row.matched,
    isOptOut: row.is_opt_out,
    normalizationFailed: Boolean(row.normalization_failed),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  };
}

function mapOptOut(row: OptOutRow): SmsOptOutRecord {
  return {
    phone: row.phone,
    source: row.source,
    reason: row.reason,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

async function requireDb() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }
  await ensureCustomerSchema();
  return sql();
}

export async function getSmsLeadState(slug: string): Promise<SmsLeadState | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM sms_lead_state WHERE slug = ${slug} LIMIT 1
  `) as StateRow[];
  return rows[0] ? mapState(rows[0]) : null;
}

export async function listSmsLeadStates(): Promise<SmsLeadState[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`SELECT * FROM sms_lead_state`) as StateRow[];
  return rows.map(mapState);
}

export async function listSmsLeadStatesBySlugs(
  slugs: string[],
): Promise<SmsLeadState[]> {
  if (!isDatabaseConfigured() || slugs.length === 0) {
    return [];
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM sms_lead_state WHERE slug = ANY(${slugs})
  `) as StateRow[];
  return rows.map(mapState);
}

export async function upsertSmsLeadState(input: {
  slug: string;
  normalizedPhone?: string | null;
  smsStatus?: SmsLeadStatus;
  smsAllowed?: boolean;
  smsSentAt?: string | null;
  smsLastError?: string | null;
  smsMessageId?: string | null;
  smsReplyAt?: string | null;
}): Promise<SmsLeadState> {
  const db = await requireDb();
  const existing = await getSmsLeadState(input.slug);
  const nextStatus = input.smsStatus ?? existing?.smsStatus ?? "pending";
  const nextAllowed = input.smsAllowed ?? existing?.smsAllowed ?? true;
  const nextPhone = input.normalizedPhone ?? existing?.normalizedPhone ?? null;
  const nextSentAt = input.smsSentAt ?? existing?.smsSentAt ?? null;
  const nextError =
    input.smsLastError === undefined
      ? (existing?.smsLastError ?? null)
      : input.smsLastError;
  const nextMessageId = input.smsMessageId ?? existing?.smsMessageId ?? null;
  const nextReplyAt = input.smsReplyAt ?? existing?.smsReplyAt ?? null;

  const rows = (await db`
    INSERT INTO sms_lead_state (
      slug, normalized_phone, sms_status, sms_allowed, sms_sent_at,
      sms_last_error, sms_message_id, sms_reply_at, updated_at
    )
    VALUES (
      ${input.slug}, ${nextPhone}, ${nextStatus}, ${nextAllowed}, ${nextSentAt},
      ${nextError}, ${nextMessageId}, ${nextReplyAt}, NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      normalized_phone = EXCLUDED.normalized_phone,
      sms_status = EXCLUDED.sms_status,
      sms_allowed = EXCLUDED.sms_allowed,
      sms_sent_at = EXCLUDED.sms_sent_at,
      sms_last_error = EXCLUDED.sms_last_error,
      sms_message_id = EXCLUDED.sms_message_id,
      sms_reply_at = EXCLUDED.sms_reply_at,
      updated_at = NOW()
    RETURNING *
  `) as StateRow[];

  if (!rows[0]) {
    throw new Error(`Failed to upsert sms_lead_state for ${input.slug}`);
  }
  return mapState(rows[0]);
}

export async function getSmsMessageById(
  messageId: string,
): Promise<SmsMessageRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    SELECT * FROM sms_messages WHERE message_id = ${messageId} LIMIT 1
  `) as MessageRow[];
  return rows[0] ? mapMessage(rows[0]) : null;
}

export async function listSmsMessagesForSlug(
  slug: string,
): Promise<SmsMessageRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM sms_messages WHERE slug = ${slug} ORDER BY created_at DESC
  `) as MessageRow[];
  return rows.map(mapMessage);
}

export async function hasActiveOrSentStep(
  slug: string,
  step: SmsStep,
): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT id FROM sms_messages
    WHERE slug = ${slug}
      AND step = ${step}
      AND status IN ('queued', 'claimed', 'sending', 'sent')
    LIMIT 1
  `) as Array<{ id: number }>;
  return rows.length > 0;
}

export async function insertQueuedMessage(input: {
  messageId: string;
  slug: string;
  toPhone: string;
  toPhoneRaw: string | null;
  body: string;
  step: SmsStep;
}): Promise<SmsMessageRecord> {
  const db = await requireDb();
  const rows = (await db`
    INSERT INTO sms_messages (
      message_id, slug, to_phone, to_phone_raw, body, status, step, created_at, updated_at
    )
    VALUES (
      ${input.messageId}, ${input.slug}, ${input.toPhone}, ${input.toPhoneRaw},
      ${input.body}, 'queued', ${input.step}, NOW(), NOW()
    )
    RETURNING *
  `) as MessageRow[];

  if (!rows[0]) {
    throw new Error("Failed to insert sms_messages row");
  }
  return mapMessage(rows[0]);
}

export async function claimQueuedMessages(input: {
  limit: number;
  claimedBy: string;
  leaseMinutes: number;
}): Promise<SmsMessageRecord[]> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE sms_messages AS m
    SET
      status = 'claimed',
      claimed_at = NOW(),
      claimed_by = ${input.claimedBy},
      claim_expires_at = NOW() + make_interval(mins => ${input.leaseMinutes}),
      updated_at = NOW()
    WHERE m.id IN (
      SELECT id
      FROM sms_messages
      WHERE (
          status = 'queued'
          OR (
            status IN ('claimed', 'sending')
            AND claim_expires_at IS NOT NULL
            AND claim_expires_at < NOW()
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM sms_opt_outs o WHERE o.phone = sms_messages.to_phone
        )
      ORDER BY created_at ASC
      LIMIT ${input.limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `) as MessageRow[];

  return rows.map(mapMessage);
}

export async function markMessageSending(
  messageId: string,
): Promise<SmsMessageRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE sms_messages
    SET status = 'sending', updated_at = NOW()
    WHERE message_id = ${messageId}
      AND status IN ('claimed', 'sending')
    RETURNING *
  `) as MessageRow[];
  return rows[0] ? mapMessage(rows[0]) : null;
}

export async function applyMessageResult(input: {
  messageId: string;
  success: boolean;
  providerMessageId?: string | null;
  error?: string | null;
}): Promise<SmsMessageRecord | null> {
  const db = await requireDb();
  const nextStatus = input.success ? "sent" : "failed";
  const rows = (await db`
    UPDATE sms_messages
    SET
      status = ${nextStatus},
      provider_message_id = COALESCE(${input.providerMessageId ?? null}, provider_message_id),
      last_error = ${input.success ? null : (input.error ?? "Send failed")},
      sent_at = CASE WHEN ${input.success} THEN COALESCE(sent_at, NOW()) ELSE sent_at END,
      updated_at = NOW()
    WHERE message_id = ${input.messageId}
      AND status IN ('claimed', 'sending', 'queued', 'failed')
    RETURNING *
  `) as MessageRow[];
  return rows[0] ? mapMessage(rows[0]) : null;
}

export async function countSentToday(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT COUNT(*)::int AS count
    FROM sms_messages
    WHERE status = 'sent'
      AND sent_at >= date_trunc('day', NOW())
  `) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

/** Sent today + still in-flight (queued/claimed/sending). Used for daily limit. */
export async function countDailySmsBudgetUsed(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT COUNT(*)::int AS count
    FROM sms_messages
    WHERE
      status IN ('queued', 'claimed', 'sending')
      OR (
        status = 'sent'
        AND sent_at >= date_trunc('day', NOW())
      )
  `) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

export async function getSmsQueueStalenessHours(): Promise<number | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT MIN(created_at) AS oldest
    FROM sms_messages
    WHERE status IN ('queued', 'claimed', 'sending')
  `) as Array<{ oldest: Date | string | null }>;

  const oldest = rows[0]?.oldest;
  if (!oldest) {
    return null;
  }
  const ageMs = Date.now() - new Date(oldest).getTime();
  return ageMs / 3_600_000;
}

export async function countByLeadStatus(): Promise<Record<string, number>> {
  if (!isDatabaseConfigured()) {
    return {};
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT sms_status, COUNT(*)::int AS count
    FROM sms_lead_state
    GROUP BY sms_status
  `) as Array<{ sms_status: string; count: number }>;

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.sms_status] = row.count;
  }
  return result;
}

export async function findSlugByNormalizedPhone(
  e164: string,
): Promise<string | null> {
  const slugs = await findSlugsByNormalizedPhone(e164);
  return slugs[0] ?? null;
}

export async function findSlugsByNormalizedPhone(
  e164: string,
): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT slug FROM sms_lead_state WHERE normalized_phone = ${e164}
  `) as Array<{ slug: string }>;
  return rows.map((row) => row.slug);
}

export async function insertInbound(input: {
  providerMessageId?: string | null;
  fromPhone: string;
  toPhone?: string | null;
  body: string;
  receivedAt?: string | null;
  slug?: string | null;
  matched: boolean;
  isOptOut: boolean;
  normalizationFailed?: boolean;
}): Promise<SmsInboundRecord> {
  const db = await requireDb();
  const receivedAt = input.receivedAt ?? new Date().toISOString();
  const normalizationFailed = input.normalizationFailed ?? false;

  if (input.providerMessageId) {
    const rows = (await db`
      INSERT INTO sms_inbound (
        provider_message_id, from_phone, to_phone, body, received_at, slug, matched, is_opt_out,
        normalization_failed
      )
      VALUES (
        ${input.providerMessageId},
        ${input.fromPhone},
        ${input.toPhone ?? null},
        ${input.body},
        ${receivedAt}::timestamptz,
        ${input.slug ?? null},
        ${input.matched},
        ${input.isOptOut},
        ${normalizationFailed}
      )
      ON CONFLICT (provider_message_id) DO UPDATE SET
        body = EXCLUDED.body,
        is_opt_out = EXCLUDED.is_opt_out,
        normalization_failed = EXCLUDED.normalization_failed
      RETURNING *
    `) as InboundRow[];
    if (!rows[0]) {
      throw new Error("Failed to insert sms_inbound");
    }
    return mapInbound(rows[0]);
  }

  const rows = (await db`
    INSERT INTO sms_inbound (
      from_phone, to_phone, body, received_at, slug, matched, is_opt_out, normalization_failed
    )
    VALUES (
      ${input.fromPhone},
      ${input.toPhone ?? null},
      ${input.body},
      ${receivedAt}::timestamptz,
      ${input.slug ?? null},
      ${input.matched},
      ${input.isOptOut},
      ${normalizationFailed}
    )
    RETURNING *
  `) as InboundRow[];
  if (!rows[0]) {
    throw new Error("Failed to insert sms_inbound");
  }
  return mapInbound(rows[0]);
}

export async function listInboundForSlug(
  slug: string,
): Promise<SmsInboundRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM sms_inbound WHERE slug = ${slug} ORDER BY received_at DESC
  `) as InboundRow[];
  return rows.map(mapInbound);
}

export async function isSmsOptedOut(phone: string): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT 1 FROM sms_opt_outs WHERE phone = ${phone} LIMIT 1
  `) as Array<{ "?column?": number }>;
  return rows.length > 0;
}

export async function upsertSmsOptOut(input: {
  phone: string;
  source: string;
  reason: string;
}): Promise<SmsOptOutRecord> {
  const db = await requireDb();
  const rows = (await db`
    INSERT INTO sms_opt_outs (phone, source, reason, created_at, updated_at)
    VALUES (${input.phone}, ${input.source}, ${input.reason}, NOW(), NOW())
    ON CONFLICT (phone) DO UPDATE SET
      source = EXCLUDED.source,
      reason = EXCLUDED.reason,
      updated_at = NOW()
    RETURNING *
  `) as OptOutRow[];
  if (!rows[0]) {
    throw new Error("Failed to upsert sms_opt_outs");
  }
  return mapOptOut(rows[0]);
}

export async function cancelQueuedAndClaimedForPhone(
  e164: string,
): Promise<number> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE sms_messages
    SET status = 'cancelled', last_error = 'sms_opt_out', updated_at = NOW()
    WHERE to_phone = ${e164}
      AND status IN ('queued', 'claimed')
    RETURNING id
  `) as Array<{ id: number }>;
  return rows.length;
}

export async function listRecentSmsOptOuts(
  limit = 20,
): Promise<SmsOptOutRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM sms_opt_outs ORDER BY updated_at DESC LIMIT ${limit}
  `) as OptOutRow[];
  return rows.map(mapOptOut);
}

export async function authorizeSmsSend(
  messageId: string,
): Promise<AuthorizeSmsSendResult> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE sms_messages AS m
    SET status = 'sending', updated_at = NOW()
    WHERE m.message_id = ${messageId}
      AND (
        (
          m.status = 'claimed'
          AND NOT EXISTS (
            SELECT 1 FROM sms_opt_outs o WHERE o.phone = m.to_phone
          )
        )
        OR m.status = 'sending'
      )
    RETURNING *
  `) as MessageRow[];

  if (rows[0]) {
    return { send: true };
  }

  const existing = (await db`
    SELECT status, to_phone FROM sms_messages WHERE message_id = ${messageId} LIMIT 1
  `) as Array<{ status: string; to_phone: string }>;
  if (!existing[0]) {
    return { send: false, reason: "not_found" };
  }
  if (existing[0].status === "cancelled") {
    return { send: false, reason: "cancelled" };
  }
  const optedOut = (await db`
    SELECT 1 FROM sms_opt_outs WHERE phone = ${existing[0].to_phone} LIMIT 1
  `) as Array<{ "?column?": number }>;
  if (optedOut.length > 0 && existing[0].status === "claimed") {
    await db`
      UPDATE sms_messages
      SET status = 'cancelled', last_error = 'sms_opt_out', updated_at = NOW()
      WHERE message_id = ${messageId}
        AND status = 'claimed'
    `;
    return { send: false, reason: "sms_opt_out" };
  }
  return { send: false, reason: "not_claimable" };
}

