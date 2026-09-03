import { ZodError } from "zod";

export class QaRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QaRetryableError";
  }
}

export class QaFatalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QaFatalError";
  }
}

export function isQaRetryable(error: unknown): boolean {
  if (error instanceof QaFatalError) {
    return false;
  }
  if (error instanceof QaRetryableError) {
    return true;
  }

  if (error instanceof ZodError) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  const status =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status?: number }).status)
      : null;

  if (status === 401 || status === 403) {
    return false;
  }
  if (status != null && status >= 500) {
    return true;
  }
  if (status === 429) {
    return true;
  }

  return /timeout|network|ECONNRESET|ETIMEDOUT|invalid JSON|does not match the schema|ZodError/i.test(
    message,
  );
}
