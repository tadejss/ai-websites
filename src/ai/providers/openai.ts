import OpenAI from "openai";
import { GenerationContentError } from "../generation-error";
import type { BusinessInput } from "../types";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseAndValidateSiteConfig,
} from "./prompt";
import type { SiteConfigProvider } from "./types";

const MODEL = "gpt-4.1-mini";
const PROVIDER_NAME = "OpenAI";

function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({ apiKey });
}

export function createOpenAIProvider(): SiteConfigProvider {
  return {
    name: "openai",
    async generateSiteConfig(input: BusinessInput, correction?: string) {
      const client = createOpenAIClient();

      const response = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input, correction) },
        ],
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new GenerationContentError(
          `${PROVIDER_NAME} returned an empty response`,
        );
      }

      return parseAndValidateSiteConfig(content, PROVIDER_NAME, input);
    },
  };
}
