import { createGeminiProvider } from "./gemini";
import { createOpenAIProvider } from "./openai";
import type { SiteConfigProvider } from "./types";

export type { SiteConfigProvider } from "./types";

export function getSiteConfigProvider(): SiteConfigProvider {
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
