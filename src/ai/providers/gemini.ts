import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerationContentError } from "../generation-error";
import type { BusinessInput } from "../types";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseAndValidateSiteConfig,
} from "./prompt";
import type { SiteConfigProvider } from "./types";

const MODEL = "gemini-3.5-flash-lite";
const PROVIDER_NAME = "Gemini";

function createGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenerativeAI(apiKey);
}

export function createGeminiProvider(): SiteConfigProvider {
  return {
    name: "gemini",
    async generateSiteConfig(input: BusinessInput, correction?: string) {
      const client = createGeminiClient();
      const model = client.getGenerativeModel({
        model: MODEL,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const response = await model.generateContent(
        buildUserPrompt(input, correction),
      );
      const content = response.response.text();

      if (!content) {
        throw new GenerationContentError(
          `${PROVIDER_NAME} returned an empty response`,
        );
      }

      return parseAndValidateSiteConfig(content, PROVIDER_NAME, input);
    },
  };
}
