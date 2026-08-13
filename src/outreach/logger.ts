import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const logsDir = resolve(process.cwd(), "logs");
const logFile = resolve(logsDir, "outreach.jsonl");

export type OutreachLogEntry = {
  at: string;
  level: "info" | "warn" | "error";
  event: string;
  slug?: string;
  step?: string;
  messageId?: string;
  recipient?: string;
  subject?: string;
  dryRun?: boolean;
  details?: Record<string, unknown>;
};

export function logOutreach(entry: Omit<OutreachLogEntry, "at">): void {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    ...entry,
  });

  mkdirSync(logsDir, { recursive: true });
  appendFileSync(logFile, `${line}\n`, "utf8");

  const prefix = `[outreach:${entry.level}] ${entry.event}`;

  if (entry.level === "error") {
    console.error(prefix, entry.details ?? "");
  } else if (entry.level === "warn") {
    console.warn(prefix, entry.details ?? "");
  } else {
    console.log(prefix, entry.slug ?? "", entry.step ?? "");
  }
}
