import { validateBusinessInput } from "../../validate-business-input";
import type { BusinessInput } from "../../types";

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

Inference rules:
- infer reasonable values for missing business context when needed
- do NOT invent contact details
- if phone, email, address, or openingHours are unknown, use an empty string ""
- services should contain 4-6 short service names when inferring
- sellingPoints should contain 3-5 concise bullet strings when inferring

Field guidance:
- companyName: business name
- industry: business type or market
- tagline: one-line pitch
- services: array of main services or products
- phone, email, address, openingHours: contact details or empty strings
- sellingPoints: unique selling points as string array
- targetCustomers: intended audience
- serviceArea: geographic area served
- yearsExperience: experience summary, e.g. "10+ let"
- tone: desired writing tone
- brandStyle: brand personality or style
- competitors: competitor context or differentiation notes
- callToAction: preferred primary CTA label`;

export function buildUserPrompt(input: string): string {
  return `Generate a BusinessInput JSON object from this business description:

${input.trim()}`;
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
    throw new Error(`${providerName} returned invalid JSON`);
  }

  return validateBusinessInput(parsed);
}
