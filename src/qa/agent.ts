import { buildQaResult } from "./policy";
import { GROK_QA_JSON_SCHEMA, parseGrokQaOutputJson } from "./schemas";
import { createGrokStructuredClient } from "./client";
import { deterministicIssuesFromChecks } from "./deterministic";
import { QA_SYSTEM_PROMPT, buildQaUserPrompt } from "./prompts/qa";
import { QaRetryableError } from "./errors";
import type {
  GrokStructuredClient,
  GrokUsage,
  QaInput,
  QaIssue,
  QaResult,
} from "./types";

function issueKey(issue: QaIssue): string {
  return `${issue.type}:${issue.field}:${issue.actual}`;
}

export function mergeQaIssues(
  deterministic: QaIssue[],
  fromGrok: QaIssue[],
): QaIssue[] {
  const seen = new Set(deterministic.map(issueKey));
  const merged = [...deterministic];
  for (const issue of fromGrok) {
    const visualClaim =
      /contrast|spacing|alignment|screenshot|pixel|color/i.test(issue.message) &&
      issue.verificationStatus !== "not_verified";
    const next = visualClaim
      ? { ...issue, verificationStatus: "not_verified" as const }
      : issue;
    const key = issueKey(next);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(next);
  }
  return merged;
}

export async function runQaAgent(
  input: QaInput,
  client: GrokStructuredClient = createGrokStructuredClient(),
): Promise<{ result: QaResult; usage: GrokUsage }> {
  const deterministic = deterministicIssuesFromChecks(input.deterministicChecks);

  let grokOutput;
  try {
    const completed = await client.complete({
      system: QA_SYSTEM_PROMPT,
      user: buildQaUserPrompt(input),
      jsonSchema: GROK_QA_JSON_SCHEMA,
    });
    grokOutput = {
      parsed: parseGrokQaOutputJson(completed.text),
      usage: completed.usage,
    };
  } catch (error) {
    if (error instanceof QaRetryableError) {
      throw error;
    }
    throw error;
  }

  const issues = mergeQaIssues(deterministic, grokOutput.parsed.issues);
  const summary =
    grokOutput.parsed.summary.trim() ||
    (issues.length === 0
      ? "No issues found."
      : `${issues.length} QA issues found.`);

  return {
    result: buildQaResult(summary, issues),
    usage: grokOutput.usage,
  };
}
