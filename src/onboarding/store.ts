import { randomBytes, timingSafeEqual } from "node:crypto";
import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import { getCustomerBySlug } from "@/customers/store";
import { toAbsoluteUrl } from "@/site-url";
import type {
  CustomerOnboardingAnswers,
  OnboardingRecord,
  OnboardingStatus,
  ProcessedOnboardingPayload,
} from "./types";
import { canAdminApproveOnboarding, isOnboardingStatus } from "./types";

type OnboardingRow = {
  slug: string;
  access_token: string;
  status: string;
  answers: CustomerOnboardingAnswers | null;
  processed_payload: ProcessedOnboardingPayload | null;
  contact_email: string | null;
  contact_name: string | null;
  welcome_email_sent_at: Date | string | null;
  approval_email_sent_at: Date | string | null;
  admin_approved_at: Date | string | null;
  admin_publish_notify_sent_at: Date | string | null;
  publish_started_at: Date | string | null;
  published_at: Date | string | null;
  publish_commit_sha: string | null;
  publish_error: string | null;
  submitted_at: Date | string | null;
  processed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
}

function mapRow(row: OnboardingRow): OnboardingRecord {
  const status = isOnboardingStatus(row.status) ? row.status : "pending";

  return {
    slug: row.slug,
    accessToken: row.access_token,
    status,
    answers: row.answers ?? null,
    processedPayload: row.processed_payload ?? null,
    contactEmail: row.contact_email,
    contactName: row.contact_name,
    welcomeEmailSentAt: toIso(row.welcome_email_sent_at),
    approvalEmailSentAt: toIso(row.approval_email_sent_at),
    adminApprovedAt: toIso(row.admin_approved_at),
  adminPublishNotifySentAt: toIso(row.admin_publish_notify_sent_at),
  publishStartedAt: toIso(row.publish_started_at),
  publishedAt: toIso(row.published_at),
  publishCommitSha: row.publish_commit_sha,
  publishError: row.publish_error,
  submittedAt: toIso(row.submitted_at),
    processedAt: toIso(row.processed_at),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

async function requireDb(): Promise<ReturnType<typeof sql>> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }
  await ensureCustomerSchema();
  return sql();
}

export function getOnboardingUrl(slug: string, accessToken: string): string {
  const path = `/${slug}/vsebina?token=${encodeURIComponent(accessToken)}`;
  return toAbsoluteUrl(path) || path;
}

export async function getOnboardingBySlug(
  slug: string,
): Promise<OnboardingRecord | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM customer_onboarding WHERE slug = ${slug} LIMIT 1
  `) as OnboardingRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getOnboardingByToken(
  token: string,
): Promise<OnboardingRecord | null> {
  if (!isDatabaseConfigured() || !token.trim()) {
    return null;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM customer_onboarding WHERE access_token = ${token} LIMIT 1
  `) as OnboardingRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export function isValidOnboardingToken(
  record: OnboardingRecord | null,
  token: string | null | undefined,
): boolean {
  if (!record || !token?.trim()) {
    return false;
  }

  const expected = Buffer.from(record.accessToken);
  const actual = Buffer.from(token.trim());

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

/**
 * Creates onboarding row + token on first purchase. Token is never rotated.
 */
export async function ensureOnboardingAccess(input: {
  slug: string;
  contactEmail?: string | null;
  contactName?: string | null;
}): Promise<{ onboarding: OnboardingRecord; created: boolean }> {
  const db = await requireDb();

  const customer = await getCustomerBySlug(input.slug);
  if (!customer) {
    throw new Error(
      `Cannot create onboarding without customer row for slug "${input.slug}"`,
    );
  }

  const token = generateAccessToken();
  const email = input.contactEmail?.trim() || null;
  const name = input.contactName?.trim() || null;

  const inserted = (await db`
    INSERT INTO customer_onboarding (
      slug,
      access_token,
      status,
      contact_email,
      contact_name,
      created_at,
      updated_at
    )
    VALUES (
      ${input.slug},
      ${token},
      'pending',
      ${email},
      ${name},
      NOW(),
      NOW()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING *
  `) as OnboardingRow[];

  if (inserted[0]) {
    return { onboarding: mapRow(inserted[0]), created: true };
  }

  const existing = await getOnboardingBySlug(input.slug);
  if (!existing) {
    throw new Error(
      `Onboarding insert did not persist for slug "${input.slug}"`,
    );
  }

  if (email || name) {
    await db`
      UPDATE customer_onboarding
      SET
        contact_email = COALESCE(contact_email, ${email}),
        contact_name = COALESCE(contact_name, ${name}),
        updated_at = NOW()
      WHERE slug = ${input.slug}
    `;
  }

  const refreshed = await getOnboardingBySlug(input.slug);
  if (!refreshed) {
    throw new Error(`Onboarding missing after ensure for slug "${input.slug}"`);
  }

  return { onboarding: refreshed, created: false };
}

export async function markWelcomeEmailSent(slug: string): Promise<void> {
  const db = await requireDb();
  await db`
    UPDATE customer_onboarding
    SET welcome_email_sent_at = NOW(), updated_at = NOW()
    WHERE slug = ${slug} AND welcome_email_sent_at IS NULL
  `;
}

export async function markApprovalEmailSent(slug: string): Promise<void> {
  const db = await requireDb();
  await db`
    UPDATE customer_onboarding
    SET approval_email_sent_at = NOW(), updated_at = NOW()
    WHERE slug = ${slug} AND approval_email_sent_at IS NULL
  `;
}

export async function saveOnboardingDraft(
  slug: string,
  partial: CustomerOnboardingAnswers,
): Promise<OnboardingRecord> {
  const db = await requireDb();
  const existing = await getOnboardingBySlug(slug);
  const merged = { ...(existing?.answers ?? {}), ...partial };

  const rows = (await db`
    UPDATE customer_onboarding
    SET
      answers = ${merged},
      status = CASE
        WHEN status IN ('approved_for_publish', 'publishing', 'publish_failed', 'live')
        THEN status
        ELSE 'in_progress'
      END,
      updated_at = NOW()
    WHERE slug = ${slug}
    RETURNING *
  `) as OnboardingRow[];

  if (!rows[0]) {
    throw new Error(`Onboarding not found for slug "${slug}"`);
  }

  return mapRow(rows[0]);
}

export async function submitOnboarding(
  slug: string,
  answers: CustomerOnboardingAnswers,
): Promise<{ onboarding: OnboardingRecord; alreadySubmitted: boolean }> {
  const db = await requireDb();
  const existing = await getOnboardingBySlug(slug);

  if (
    existing &&
    [
      "approved_for_publish",
      "publishing",
      "publish_failed",
      "live",
    ].includes(existing.status)
  ) {
    return { onboarding: existing, alreadySubmitted: true };
  }

  const rows = (await db`
    UPDATE customer_onboarding
    SET
      answers = ${answers},
      status = 'submitted',
      submitted_at = COALESCE(submitted_at, NOW()),
      updated_at = NOW()
    WHERE slug = ${slug}
    RETURNING *
  `) as OnboardingRow[];

  if (!rows[0]) {
    throw new Error(`Onboarding not found for slug "${slug}"`);
  }

  return { onboarding: mapRow(rows[0]), alreadySubmitted: false };
}

export async function updateOnboardingStatus(
  slug: string,
  status: OnboardingStatus,
  extra?: {
    processedPayload?: ProcessedOnboardingPayload;
    processedAt?: Date;
  },
): Promise<OnboardingRecord> {
  const db = await requireDb();
  const processedAt = extra?.processedAt?.toISOString() ?? null;

  const rows = (await db`
    UPDATE customer_onboarding
    SET
      status = ${status},
      processed_payload = COALESCE(${extra?.processedPayload ?? null}, processed_payload),
      processed_at = COALESCE(${processedAt}::timestamptz, processed_at),
      updated_at = NOW()
    WHERE slug = ${slug}
    RETURNING *
  `) as OnboardingRow[];

  if (!rows[0]) {
    throw new Error(`Onboarding not found for slug "${slug}"`);
  }

  return mapRow(rows[0]);
}

export async function hasSubmittedOnboarding(slug: string): Promise<boolean> {
  const record = await getOnboardingBySlug(slug);
  if (!record) {
    return false;
  }

  return [
    "submitted",
    "processing",
    "ready_for_approval",
    "approved_for_publish",
    "publishing",
    "publish_failed",
    "live",
  ].includes(record.status);
}

export type ApproveOnboardingResult = {
  onboarding: OnboardingRecord;
  alreadyApproved: boolean;
};

/**
 * Admin approval: ready_for_approval → approved_for_publish. Idempotent.
 */
export async function approveOnboardingForPublish(
  slug: string,
): Promise<ApproveOnboardingResult> {
  const db = await requireDb();
  const existing = await getOnboardingBySlug(slug);

  if (!existing) {
    throw new Error(`Onboarding not found for slug "${slug}"`);
  }

  if (
    existing.status === "approved_for_publish" ||
    existing.status === "publishing" ||
    existing.status === "live"
  ) {
    return { onboarding: existing, alreadyApproved: true };
  }

  if (!canAdminApproveOnboarding(existing.status)) {
    throw new Error(
      `Onboarding status "${existing.status}" is not ready for admin approval`,
    );
  }

  const rows = (await db`
    UPDATE customer_onboarding
    SET
      status = 'approved_for_publish',
      admin_approved_at = COALESCE(admin_approved_at, NOW()),
      updated_at = NOW()
    WHERE slug = ${slug}
    RETURNING *
  `) as OnboardingRow[];

  if (!rows[0]) {
    throw new Error(`Onboarding not found for slug "${slug}"`);
  }

  return { onboarding: mapRow(rows[0]), alreadyApproved: false };
}

export async function markAdminPublishNotifySent(slug: string): Promise<void> {
  const db = await requireDb();
  await db`
    UPDATE customer_onboarding
    SET admin_publish_notify_sent_at = NOW(), updated_at = NOW()
    WHERE slug = ${slug} AND admin_publish_notify_sent_at IS NULL
  `;
}

export async function shouldSendAdminPublishNotify(
  slug: string,
): Promise<boolean> {
  const record = await getOnboardingBySlug(slug);
  return Boolean(record && !record.adminPublishNotifySentAt);
}

export async function beginCustomerPublish(slug: string): Promise<OnboardingRecord> {
  const db = await requireDb();
  const existing = await getOnboardingBySlug(slug);
  if (!existing) {
    throw new Error(`Onboarding not found for slug "${slug}"`);
  }

  if (existing.status === "live") {
    return existing;
  }

  const allowed = ["approved_for_publish", "publish_failed", "publishing"];
  if (!allowed.includes(existing.status)) {
    throw new Error(
      `Onboarding status "${existing.status}" cannot start customer publish`,
    );
  }

  const rows = (await db`
    UPDATE customer_onboarding
    SET
      status = 'publishing',
      publish_started_at = COALESCE(publish_started_at, NOW()),
      publish_error = NULL,
      updated_at = NOW()
    WHERE slug = ${slug}
    RETURNING *
  `) as OnboardingRow[];

  if (!rows[0]) {
    throw new Error(`Onboarding not found for slug "${slug}"`);
  }

  return mapRow(rows[0]);
}

export async function markCustomerPublished(
  slug: string,
  commitSha: string,
): Promise<OnboardingRecord> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE customer_onboarding
    SET
      status = 'live',
      published_at = NOW(),
      publish_commit_sha = ${commitSha},
      publish_error = NULL,
      updated_at = NOW()
    WHERE slug = ${slug}
    RETURNING *
  `) as OnboardingRow[];

  if (!rows[0]) {
    throw new Error(`Onboarding not found for slug "${slug}"`);
  }

  return mapRow(rows[0]);
}

export async function markCustomerPublishFailed(
  slug: string,
  error: string,
): Promise<OnboardingRecord> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE customer_onboarding
    SET
      status = 'publish_failed',
      publish_error = ${error.slice(0, 4000)},
      updated_at = NOW()
    WHERE slug = ${slug}
    RETURNING *
  `) as OnboardingRow[];

  if (!rows[0]) {
    throw new Error(`Onboarding not found for slug "${slug}"`);
  }

  return mapRow(rows[0]);
}
