import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { RawBusinessData } from "@/ai/types/raw-business-data";
import { validateRawBusinessData } from "@/ai/validate-raw-business-data";
import { findLeadByPlaceId } from "@/leads/store";
import { fetchBusinessByQuery } from "@/sources/google-places-source";
import type { BusinessSource } from "@/sources/types";
import { generateClient } from "./generate-client";
import { slugFromBusinessName } from "./slug";

export type CreateClientResult =
  | {
      outcome: "created";
      slug: string;
      companyName: string;
      googlePlaceId: string;
    }
  | {
      outcome: "skipped";
      reason: string;
      slug: string;
      companyName: string;
      googlePlaceId: string;
    };

export function clientExists(slug: string): boolean {
  return existsSync(
    resolve(__dirname, "../content/clients", slug, "site.json"),
  );
}

function createCachedSource(data: RawBusinessData): BusinessSource {
  return {
    async getBusiness() {
      return data;
    },
  };
}

export async function createClientFromQuery(
  query: string,
): Promise<CreateClientResult> {
  const rawBusiness = validateRawBusinessData(await fetchBusinessByQuery(query));

  const companyName = rawBusiness.name ?? "";
  const googlePlaceId = rawBusiness.googlePlaceId ?? "";

  const existingLead = findLeadByPlaceId(googlePlaceId);

  if (existingLead) {
    return {
      outcome: "skipped",
      reason: `already exists as "${existingLead.slug}" (same Google Place ID)`,
      slug: existingLead.slug,
      companyName,
      googlePlaceId,
    };
  }

  const slug = slugFromBusinessName(companyName);

  if (!slug) {
    throw new Error(
      `Could not create a slug from the business name "${companyName}"`,
    );
  }

  if (clientExists(slug)) {
    return {
      outcome: "skipped",
      reason: `client "${slug}" already exists`,
      slug,
      companyName,
      googlePlaceId,
    };
  }

  await generateClient(slug, createCachedSource(rawBusiness));

  return { outcome: "created", slug, companyName, googlePlaceId };
}
