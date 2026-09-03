import OpenAI from "openai";
import { getGrokQaConfig } from "./config";
import { QaFatalError, QaRetryableError } from "./errors";
import { estimateGrokCostUsd } from "./models";
import type { GrokStructuredClient } from "./types";

const XAI_BASE_URL = "https://api.x.ai/v1";

export function createGrokStructuredClient(
  override?: Partial<{ apiKey: string; model: string }>,
): GrokStructuredClient {
  const config = getGrokQaConfig();
  const apiKey = override?.apiKey ?? config.apiKey;
  const model = override?.model ?? config.model;

  if (!apiKey) {
    throw new QaFatalError("XAI_API_KEY is not configured");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: XAI_BASE_URL,
  });

  return {
    async complete(input) {
      try {
        const response = await client.responses.create({
          model,
          store: false,
          prompt_cache_key: "grok-qa-v1",
          reasoning: { effort: "low" },
          text: {
            format: {
              type: "json_schema",
              name: "qa_result",
              schema: input.jsonSchema,
              strict: true,
            },
          },
          input: [
            { role: "system", content: input.system },
            { role: "user", content: input.user },
          ],
        });

        const text = response.output_text?.trim() ?? "";
        if (!text) {
          throw new QaRetryableError("Grok returned an empty response");
        }

        const inputTokens = response.usage?.input_tokens ?? 0;
        const outputTokens = response.usage?.output_tokens ?? 0;

        return {
          text,
          usage: {
            model: response.model ?? model,
            inputTokens,
            outputTokens,
            estimatedCostUsd: estimateGrokCostUsd({ inputTokens, outputTokens }),
          },
        };
      } catch (error) {
        if (error instanceof QaFatalError || error instanceof QaRetryableError) {
          throw error;
        }
        const status =
          typeof error === "object" && error && "status" in error
            ? Number((error as { status?: number }).status)
            : null;
        const message = error instanceof Error ? error.message : String(error);
        if (status === 401 || status === 403) {
          throw new QaFatalError(message);
        }
        throw new QaRetryableError(message);
      }
    },
  };
}
