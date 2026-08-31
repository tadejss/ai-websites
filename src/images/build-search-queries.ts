import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateGeminiContent } from "@/ai/gemini-request";
import type { BusinessInput } from "@/ai/types";
import type { SiteConfig } from "@/content/types/site";
import { getPalette } from "@/theme/palettes";
import { paletteToTokens } from "@/theme/utils/tokens";
import type { ImageSearchPlan } from "./types";

const MODEL = "gemini-3.5-flash-lite";

const SYSTEM_PROMPT = `You create Unsplash photo search queries for a local business website.

Return ONLY valid JSON with this exact shape:
{
  "hero": { "query": string, "alt": string, "orientation": "portrait" },
  "services": { "query": string, "alt": string, "orientation": "squarish" }
}

Rules:
- Queries must be in English, 4-8 words, specific to the business
- Include industry, key services, location vibe, and visual mood from the palette
- Avoid generic queries like "hair salon" alone — be specific (e.g. "warm hair salon interior natural light")
- alt text must be in Slovenian, concise, descriptive, no invented claims
- hero orientation is always "portrait"
- services orientation is always "squarish"
- Do not include markdown or comments`;

function createClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenerativeAI(apiKey);
}

function paletteMood(siteConfig: SiteConfig): string {
  const palette = siteConfig.theme
    ? getPalette(siteConfig.theme.paletteId)
    : undefined;

  if (!palette) {
    return "editorial, warm, premium local business";
  }

  const tokens = paletteToTokens(palette);

  return `${palette.name} palette, background ${tokens.background}, accent ${tokens.accent}, ${palette.mode} mood`;
}

export async function buildImageSearchPlan(
  businessInput: BusinessInput,
  siteConfig: SiteConfig,
): Promise<ImageSearchPlan> {
  const client = createClient();
  const model = client.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const userPrompt = `Business input:
${JSON.stringify(businessInput, null, 2)}

Site copy:
${JSON.stringify(
  {
    metadata: siteConfig.metadata,
    hero: {
      badge: siteConfig.hero.badge,
      description: siteConfig.hero.description,
    },
    services: {
      title: siteConfig.services.title,
      description: siteConfig.services.description,
      items: siteConfig.services.items.map((item) => item.title),
    },
  },
  null,
  2,
)}

Visual mood: ${paletteMood(siteConfig)}`;

  const response = await generateGeminiContent(model, userPrompt);
  const content = response.response.text();

  if (!content) {
    throw new Error("Gemini returned an empty image search plan");
  }

  const parsed = JSON.parse(content) as ImageSearchPlan;

  if (!parsed.hero?.query || !parsed.services?.query) {
    throw new Error("Image search plan is missing hero or services queries");
  }

  return {
    hero: {
      query: parsed.hero.query,
      alt: parsed.hero.alt,
      orientation: "portrait",
    },
    services: {
      query: parsed.services.query,
      alt: parsed.services.alt,
      orientation: "squarish",
    },
  };
}
