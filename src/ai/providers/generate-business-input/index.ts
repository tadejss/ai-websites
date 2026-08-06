import { createGeminiProvider } from "./gemini";
import { createOpenAIProvider } from "./openai";
import type { BusinessInputProvider } from "./types";

export type { BusinessInputProvider } from "./types";

export function getBusinessInputProvider(): BusinessInputProvider {
  const provider = process.env.AI_PROVIDER ?? "openai";

  switch (provider) {
    case "openai":
      return createOpenAIProvider();
    case "gemini":
      return createGeminiProvider();
    default:
      throw new Error(
        `Unknown AI provider "${provider}". Supported providers: openai, gemini`,
      );
  }
}
