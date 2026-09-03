import { z } from "zod";
import { getGrokQaConfig } from "./config";
import {
  QA_CATEGORIES,
  QA_ISSUE_TYPES,
  QA_SEVERITIES,
  QA_VERIFICATION_STATUSES,
  type GrokQaModelOutput,
  type QaIssue,
} from "./types";

const MAX_SUMMARY = 800;
const MAX_FIELD = 120;
const MAX_TEXT = 400;
const MAX_ID = 32;

const qaIssueSchema = z.object({
  id: z.string().max(MAX_ID).optional(),
  severity: z.enum(QA_SEVERITIES),
  category: z.enum(QA_CATEGORIES),
  type: z.enum(QA_ISSUE_TYPES),
  field: z.string().max(MAX_FIELD).default(""),
  message: z.string().max(MAX_TEXT),
  evidence: z.string().max(MAX_TEXT).default(""),
  expected: z.string().max(MAX_TEXT).default(""),
  actual: z.string().max(MAX_TEXT).default(""),
  confidence: z.number().min(0).max(1),
  verificationStatus: z.enum(QA_VERIFICATION_STATUSES).default("verified"),
  autoFixable: z.boolean().default(false),
  recommendedFix: z.string().max(MAX_TEXT).default(""),
});

export const grokQaModelOutputSchema = z.object({
  summary: z.string().max(MAX_SUMMARY),
  issues: z.array(qaIssueSchema).max(25),
});

function assignIssueIds(
  issues: Array<Omit<QaIssue, "id"> & { id?: string }>,
): QaIssue[] {
  return issues.map((issue, index) => ({
    ...issue,
    id: issue.id?.trim() || `QA-${String(index + 1).padStart(3, "0")}`,
  }));
}

export function parseGrokQaOutput(data: unknown): GrokQaModelOutput {
  const parsed = grokQaModelOutputSchema.parse(data);
  const maxIssues = getGrokQaConfig().maxIssues;
  return {
    summary: parsed.summary,
    issues: assignIssueIds(parsed.issues.slice(0, maxIssues)),
  };
}

export function parseGrokQaOutputJson(text: string): GrokQaModelOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Grok returned invalid JSON");
  }

  if (parsed && typeof parsed === "object" && "publish" in parsed) {
    throw new Error("Grok output contained a forbidden publish field");
  }

  return parseGrokQaOutput(parsed);
}

export const GROK_QA_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "issues"],
  properties: {
    summary: { type: "string", maxLength: MAX_SUMMARY },
    issues: {
      type: "array",
      maxItems: 25,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "severity",
          "category",
          "type",
          "field",
          "message",
          "evidence",
          "expected",
          "actual",
          "confidence",
          "verificationStatus",
          "autoFixable",
          "recommendedFix",
        ],
        properties: {
          id: { type: "string", maxLength: MAX_ID },
          severity: { type: "string", enum: [...QA_SEVERITIES] },
          category: { type: "string", enum: [...QA_CATEGORIES] },
          type: { type: "string", enum: [...QA_ISSUE_TYPES] },
          field: { type: "string", maxLength: MAX_FIELD },
          message: { type: "string", maxLength: MAX_TEXT },
          evidence: { type: "string", maxLength: MAX_TEXT },
          expected: { type: "string", maxLength: MAX_TEXT },
          actual: { type: "string", maxLength: MAX_TEXT },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          verificationStatus: {
            type: "string",
            enum: [...QA_VERIFICATION_STATUSES],
          },
          autoFixable: { type: "boolean" },
          recommendedFix: { type: "string", maxLength: MAX_TEXT },
        },
      },
    },
  },
};
