import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import {
  isQaPolicyStatus,
  isQaRunStatus,
  isQaTrigger,
  type QaLatestSummary,
  type QaPolicyStatus,
  type QaResult,
  type QaRunRecord,
  type QaRunStatus,
  type QaTrigger,
} from "./types";
import { highestSeverity } from "./policy";

type QaRunRow = {
  id: string;
  slug: string;
  content_hash: string;
  factory_run_id: string | null;
  trigger: string;
  run_status: string;
  policy_status: string | null;
  score: number | string | null;
  summary: string | null;
  result_json: QaResult | string | null;
  model: string | null;
  input_tokens: number | string | null;
  output_tokens: number | string | null;
  estimated_cost_usd: number | string | null;
  attempt: number | string;
  max_attempts: number | string;
  next_retry_at: Date | string | null;
  last_error: string | null;
  started_at: Date | string | null;
  completed_at: Date | string | null;
  created_at: Date | string;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseResultJson(value: QaResult | string | null): QaResult | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as QaResult;
    } catch {
      return null;
    }
  }
  return value;
}

function mapRun(row: QaRunRow): QaRunRecord {
  return {
    id: row.id,
    slug: row.slug,
    contentHash: row.content_hash,
    factoryRunId: row.factory_run_id,
    trigger: isQaTrigger(row.trigger) ? row.trigger : "cli",
    runStatus: isQaRunStatus(row.run_status) ? row.run_status : "failed",
    policyStatus:
      row.policy_status && isQaPolicyStatus(row.policy_status)
        ? row.policy_status
        : null,
    score: row.score != null ? Number(row.score) : null,
    summary: row.summary,
    resultJson: parseResultJson(row.result_json),
    model: row.model,
    inputTokens: row.input_tokens != null ? Number(row.input_tokens) : null,
    outputTokens: row.output_tokens != null ? Number(row.output_tokens) : null,
    estimatedCostUsd:
      row.estimated_cost_usd != null ? Number(row.estimated_cost_usd) : null,
    attempt: Number(row.attempt),
    maxAttempts: Number(row.max_attempts),
    nextRetryAt: toIso(row.next_retry_at),
    lastError: row.last_error,
    startedAt: toIso(row.started_at),
    completedAt: toIso(row.completed_at),
    createdAt: toIso(row.created_at)!,
  };
}

async function requireDb() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for Grok QA");
  }
  await ensureCustomerSchema();
  return sql();
}

export async function insertQaRun(input: {
  id: string;
  slug: string;
  contentHash: string;
  factoryRunId?: string | null;
  trigger: QaTrigger;
  runStatus?: QaRunStatus;
  maxAttempts: number;
}): Promise<QaRunRecord> {
  const db = await requireDb();
  const rows = (await db`
    INSERT INTO qa_runs (
      id,
      slug,
      content_hash,
      factory_run_id,
      trigger,
      run_status,
      max_attempts
    )
    VALUES (
      ${input.id},
      ${input.slug},
      ${input.contentHash},
      ${input.factoryRunId ?? null},
      ${input.trigger},
      ${input.runStatus ?? "pending"},
      ${input.maxAttempts}
    )
    RETURNING *
  `) as QaRunRow[];

  return mapRun(rows[0]!);
}

export async function getQaRunById(id: string): Promise<QaRunRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    SELECT * FROM qa_runs WHERE id = ${id} LIMIT 1
  `) as QaRunRow[];
  return rows[0] ? mapRun(rows[0]) : null;
}

export async function getLatestQaRun(slug: string): Promise<QaRunRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    SELECT * FROM qa_runs
    WHERE slug = ${slug}
    ORDER BY created_at DESC
    LIMIT 1
  `) as QaRunRow[];
  return rows[0] ? mapRun(rows[0]) : null;
}

export async function countQaRuns(slug: string): Promise<number> {
  const db = await requireDb();
  const rows = (await db`
    SELECT COUNT(*)::int AS count FROM qa_runs WHERE slug = ${slug}
  `) as Array<{ count: number | string }>;
  return Number(rows[0]?.count ?? 0);
}

export async function findCompletedQaRun(
  slug: string,
  contentHash: string,
): Promise<QaRunRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    SELECT * FROM qa_runs
    WHERE slug = ${slug}
      AND content_hash = ${contentHash}
      AND run_status = 'completed'
    ORDER BY created_at DESC
    LIMIT 1
  `) as QaRunRow[];
  return rows[0] ? mapRun(rows[0]) : null;
}

export async function findActiveQaRun(
  slug: string,
  contentHash: string,
): Promise<QaRunRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    SELECT * FROM qa_runs
    WHERE slug = ${slug}
      AND content_hash = ${contentHash}
      AND run_status IN ('pending', 'running')
    ORDER BY created_at DESC
    LIMIT 1
  `) as QaRunRow[];
  return rows[0] ? mapRun(rows[0]) : null;
}

export async function listDueQaRuns(limit: number): Promise<QaRunRecord[]> {
  const db = await requireDb();
  const rows = (await db`
    SELECT * FROM qa_runs
    WHERE run_status = 'pending'
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    ORDER BY COALESCE(next_retry_at, created_at) ASC
    LIMIT ${limit}
  `) as QaRunRow[];
  return rows.map(mapRun);
}

export async function markQaRunRunning(id: string): Promise<QaRunRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE qa_runs
    SET
      run_status = 'running',
      started_at = COALESCE(started_at, NOW()),
      last_error = NULL
    WHERE id = ${id}
      AND run_status IN ('pending', 'running')
    RETURNING *
  `) as QaRunRow[];
  return rows[0] ? mapRun(rows[0]) : null;
}

export async function markQaRunCompleted(input: {
  id: string;
  result: QaResult;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}): Promise<QaRunRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE qa_runs
    SET
      run_status = 'completed',
      policy_status = ${input.result.policyStatus},
      score = ${input.result.score},
      summary = ${input.result.summary},
      result_json = ${JSON.stringify(input.result)}::jsonb,
      model = ${input.model},
      input_tokens = ${input.inputTokens},
      output_tokens = ${input.outputTokens},
      estimated_cost_usd = ${input.estimatedCostUsd},
      last_error = NULL,
      next_retry_at = NULL,
      completed_at = NOW()
    WHERE id = ${input.id}
      AND run_status = 'running'
      AND result_json IS NULL
    RETURNING *
  `) as QaRunRow[];
  return rows[0] ? mapRun(rows[0]) : null;
}

export async function markQaRunFailed(input: {
  id: string;
  error: string;
  attempt: number;
  retryAt: Date | null;
  terminal: boolean;
}): Promise<void> {
  const db = await requireDb();
  const status: QaRunStatus = input.terminal ? "failed" : "pending";
  await db`
    UPDATE qa_runs
    SET
      run_status = ${status},
      attempt = ${input.attempt},
      last_error = ${input.error.slice(0, 500)},
      next_retry_at = ${input.retryAt ? input.retryAt.toISOString() : null}::timestamptz
    WHERE id = ${input.id}
      AND run_status IN ('pending', 'running')
  `;
}

export async function markQaRunSkipped(input: {
  id: string;
  reason: string;
}): Promise<void> {
  const db = await requireDb();
  await db`
    UPDATE qa_runs
    SET
      run_status = 'skipped',
      last_error = ${input.reason.slice(0, 500)},
      completed_at = NOW()
    WHERE id = ${input.id}
      AND run_status IN ('pending', 'running')
  `;
}

export async function getQaLatestSummary(
  slug: string,
): Promise<QaLatestSummary | null> {
  const latest = await getLatestQaRun(slug);
  if (!latest) {
    return null;
  }
  const runCount = await countQaRuns(slug);
  const issues = latest.resultJson?.issues ?? [];
  return {
    runStatus: latest.runStatus,
    policyStatus: latest.policyStatus,
    score: latest.score,
    summary: latest.summary,
    createdAt: latest.createdAt,
    completedAt: latest.completedAt,
    runCount,
    openIssueCount: issues.length,
    highestSeverity: highestSeverity(issues),
    model: latest.model,
    issues,
  };
}

export async function countQaRunsByStatus(): Promise<{
  pending: number;
  failed: number;
}> {
  if (!isDatabaseConfigured()) {
    return { pending: 0, failed: 0 };
  }
  const db = await requireDb();
  const rows = (await db`
    SELECT run_status, COUNT(*)::int AS count
    FROM qa_runs
    WHERE run_status IN ('pending', 'failed')
    GROUP BY run_status
  `) as Array<{ run_status: string; count: number | string }>;

  const counts = { pending: 0, failed: 0 };
  for (const row of rows) {
    if (row.run_status === "pending") counts.pending = Number(row.count);
    if (row.run_status === "failed") counts.failed = Number(row.count);
  }
  return counts;
}

export function shouldSkipAutomaticQa(input: {
  completedHash: string | null;
  contentHash: string;
  force: boolean;
}): boolean {
  if (input.force) {
    return false;
  }
  return input.completedHash === input.contentHash;
}

export type { QaPolicyStatus };
