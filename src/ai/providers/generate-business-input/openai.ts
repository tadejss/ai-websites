import OpenAI from "openai";
import type { RawBusinessData } from "../../types/raw-business-data";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseBusinessInput,
} from "./prompt";
import type { BusinessInputProvider } from "./types";

const MODEL = "gpt-4.1-mini";
const PROVIDER_NAME = "OpenAI";

function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({ apiKey });
}

export function createOpenAIProvider(): BusinessInputProvider {
  return {
    name: "openai",
    async generateBusinessInput(input: RawBusinessData) {
      const client = createOpenAIClient();

      const response = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error(`${PROVIDER_NAME} returned an empty response`);
      }

      return parseBusinessInput(content, PROVIDER_NAME);
    },
  };
}
