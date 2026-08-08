import {
  GenerationContentError,
  toContentError,
} from "../../generation-error";
import { validateBusinessInput } from "../../validate-business-input";
import { validateRawBusinessData } from "../../validate-raw-business-data";
import type { BusinessInput } from "../../types";
import type { RawBusinessData } from "../../types/raw-business-data";

export const SYSTEM_PROMPT = `You generate BusinessInput JSON for a local business website.

Return ONLY a valid JSON object. No markdown, no code fences, no comments, and no text before or after the JSON.

Every field and value MUST match the BusinessInput schema exactly:
- include every required field listed below
- do not add extra keys
- never use null
- services and sellingPoints must be arrays of strings

Required fields (exactly these sixteen):
companyName, industry, tagline, services, phone, email, address, openingHours, sellingPoints, targetCustomers, serviceArea, yearsExperience, tone, brandStyle, competitors, callToAction

Write all text in Slovenian by default unless the source input clearly specifies another language.

Source data:
The user message contains structured RawBusinessData scraped from the web. Map these fields into BusinessInput:
- name → companyName
- category → industry
- description → tagline and supporting copy context
- phone → phone
- email → email
- address → address
- openingHours → openingHours
- website → serviceArea or business context only; never invent a website URL
- reviews → sellingPoints when present; paraphrase review themes, do not copy verbatim unless useful
- infer targetCustomers, services, yearsExperience, tone, brandStyle, competitors, and callToAction from the available data

Contact and trust rules (strict):
- NEVER invent contact information
- phone, email, address, and openingHours must come ONLY from RawBusinessData
- if phone, email, address, or openingHours are missing in RawBusinessData, return an empty string ""
- NEVER create fake domains, email addresses, phone numbers, or street addresses
- NEVER create fake ratings or review counts
- do NOT copy rating or reviewCount into BusinessInput; use reviews only when present to inform sellingPoints
- do NOT fabricate social proof numbers in yearsExperience, sellingPoints, or any other field

Inference rules:
- infer reasonable values for missing non-contact business context when needed
- services should contain 4-6 short service names when inferring
- sellingPoints should contain 3-5 concise bullet strings when inferring
- tone and brandStyle must be short, clear phrases (2-5 words each); avoid long sentences and typo-prone wording

Field guidance:
- companyName: business name
- industry: business type or market
- tagline: one-line pitch
- services: array of main services or products
- phone, email, address, openingHours: copy from RawBusinessData exactly or use ""
- sellingPoints: unique selling points as string array
- targetCustomers: intended audience
- serviceArea: geographic area served; may be inferred from address or website when present
- yearsExperience: experience summary only when supportable from source data, otherwise ""
- tone: concise writing tone, e.g. "profesionalen, prijazen"
- brandStyle: concise brand style, e.g. "zanesljiv lokalni servis"
- competitors: competitor context or differentiation notes
- callToAction: preferred primary CTA label`;

function withoutInternalFields(
  data: RawBusinessData,
): Omit<RawBusinessData, "googlePlaceId"> {
  const promptData = { ...data };
  delete promptData.googlePlaceId;
  return promptData;
}

export function buildUserPrompt(
  input: RawBusinessData,
  correction?: string,
): string {
  const data = withoutInternalFields(validateRawBusinessData(input));

  const prompt = `Generate a BusinessInput JSON object from this scraped business data:

${JSON.stringify(data, null, 2)}`;

  if (!correction) {
    return prompt;
  }

  return `${prompt}

Your previous attempt was rejected. Fix exactly these problems and return the corrected JSON:
${correction}`;
}

function stripMarkdownFences(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (fenced) {
    return fenced[1].trim();
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractJsonObject(content: string): string {
  const start = content.indexOf("{");

  if (start === -1) {
    return content;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < content.length; i++) {
    const char = content[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return content.slice(start, i + 1);
      }
    }
  }

  return content.slice(start);
}

function sanitizeJsonResponse(content: string): string {
  const withoutFences = stripMarkdownFences(content);
  return extractJsonObject(withoutFences).trim();
}

export function parseBusinessInput(
  content: string,
  providerName: string,
): BusinessInput {
  let parsed: unknown;

  try {
    parsed = JSON.parse(sanitizeJsonResponse(content));
  } catch {
    throw new GenerationContentError(
      `${providerName} returned invalid JSON`,
    );
  }

  try {
    return validateBusinessInput(parsed);
  } catch (error) {
    throw toContentError(error);
  }
}
