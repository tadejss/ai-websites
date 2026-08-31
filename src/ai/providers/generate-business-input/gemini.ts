import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateGeminiContent } from "../../gemini-request";
import { GenerationContentError } from "../../generation-error";
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
    async generateBusinessInput(input: RawBusinessData, correction?: string) {
      const client = createGeminiClient();
      const model = client.getGenerativeModel({
        model: MODEL,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const response = await generateGeminiContent(
        model,
        buildUserPrompt(input, correction),
      );
      const content = response.response.text();

      if (!content) {
        throw new GenerationContentError(
          `${PROVIDER_NAME} returned an empty response`,
        );
      }

      return parseBusinessInput(content, PROVIDER_NAME);
    },
  };
}
