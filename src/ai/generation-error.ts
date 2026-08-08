import { ZodError } from "zod";

/**
 * A problem with what the model returned, as opposed to a configuration or
 * transport failure. Only these are worth retrying: a missing API key or a
 * quota error would fail identically on a second attempt.
 */
export class GenerationContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationContentError";
  }
}

export function isRetryable(error: unknown): boolean {
  return error instanceof GenerationContentError;
}

function describeZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

export function toContentError(error: unknown): GenerationContentError {
  if (error instanceof GenerationContentError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new GenerationContentError(
      `Generated JSON does not match the schema:\n${describeZodError(error)}`,
    );
  }

  return new GenerationContentError(
    error instanceof Error ? error.message : String(error),
  );
}
