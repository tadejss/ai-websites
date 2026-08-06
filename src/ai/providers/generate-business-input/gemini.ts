import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RawBusinessData } from "../../types/raw-business-data";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseBusinessInput,
} from "./prompt";
import type { BusinessInputProvider } from "./types";

const MODEL = "gemini-3.5-flash-lite";
const PROVIDER_NAME = "Gemini";

function createGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenerativeAI(apiKey);
}

export function createGeminiProvider(): BusinessInputProvider {
  return {
    name: "gemini",
    async generateBusinessInput(input: RawBusinessData) {
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

      return parseBusinessInput(content, PROVIDER_NAME);
    },
  };
}
