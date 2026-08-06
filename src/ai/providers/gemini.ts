import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BusinessInput } from "../types";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseAndValidateSiteConfig,
} from "./prompt";
import type { SiteConfigProvider } from "./types";

const MODEL = "gemini-2.0-flash";
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
    async generateSiteConfig(input: BusinessInput) {
      const client = createGeminiClient();
      const model = client.getGenerativeModel({
        model: MODEL,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const response = await model.generateContent(buildUserPrompt(input));
      const content = response.response.text();

      if (!content) {
        throw new Error(`${PROVIDER_NAME} returned an empty response`);
      }

      return parseAndValidateSiteConfig(content, PROVIDER_NAME);
    },
  };
}
