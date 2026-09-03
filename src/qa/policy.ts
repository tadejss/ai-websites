import type { QaIssue, QaPolicyStatus, QaSeverity } from "./types";
import { getGrokQaConfig } from "./config";

const SCORE_PENALTY: Record<QaSeverity, number> = {
  critical: 40,
  high: 20,
  medium: 8,
  low: 2,
};

const SEVERITY_RANK: Record<QaSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function scoreQaIssues(issues: QaIssue[]): number {
  const penalty = issues.reduce(
    (sum, issue) => sum + (SCORE_PENALTY[issue.severity] ?? 0),
    0,
  );
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function highestSeverity(issues: QaIssue[]): QaSeverity | null {
  let best: QaSeverity | null = null;
  for (const issue of issues) {
    if (!best || SEVERITY_RANK[issue.severity] > SEVERITY_RANK[best]) {
      best = issue.severity;
    }
  }
  return best;
}

export function applyQaPolicy(
  issues: QaIssue[],
  failOnMedium = getGrokQaConfig().failOnMedium,
): QaPolicyStatus {
  if (issues.some((issue) => issue.severity === "critical" || issue.severity === "high")) {
    return "fail";
  }
  if (issues.some((issue) => issue.severity === "medium")) {
    return failOnMedium ? "fail" : "warning";
  }
  if (issues.some((issue) => issue.severity === "low")) {
    return "warning";
  }
  return "pass";
}

export function buildQaResult(
  summary: string,
  issues: QaIssue[],
  failOnMedium?: boolean,
): {
  summary: string;
  issues: QaIssue[];
  score: number;
  policyStatus: QaPolicyStatus;
} {
  return {
    summary,
    issues,
    score: scoreQaIssues(issues),
    policyStatus: applyQaPolicy(issues, failOnMedium),
  };
}
