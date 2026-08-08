import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

export type GenerationOutcome = "created" | "skipped" | "failed";

export type GenerationLogEntry = {
  query: string;
  outcome: GenerationOutcome;
  durationMs: number;
  slug?: string;
  companyName?: string;
  googlePlaceId?: string;
  reason?: string;
};

const logsDir = resolve(__dirname, "../../logs");
const logFile = resolve(logsDir, "generations.jsonl");

export function appendGenerationLog(entry: GenerationLogEntry): void {
  const line = {
    timestamp: new Date().toISOString(),
    provider: process.env.AI_PROVIDER ?? "openai",
    ...entry,
  };

  try {
    mkdirSync(logsDir, { recursive: true });
    appendFileSync(logFile, `${JSON.stringify(line)}\n`, "utf8");
  } catch {
    // Logging must never take down a generation run.
  }
}

export function getGenerationLogPath(): string {
  return logFile;
}
