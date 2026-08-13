import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isValidEmail } from "@/outreach/validate-email";
import type { LeadRecord } from "./store";

const clientsDir = resolve(__dirname, "../content/clients");

function readBusinessEmail(slug: string): string | undefined {
  const path = resolve(clientsDir, slug, "business.json");

  if (!existsSync(path)) {
    return undefined;
  }

  try {
    const business = JSON.parse(readFileSync(path, "utf8")) as { email?: string };
    const email = business.email?.trim();

    return email && isValidEmail(email) ? email : undefined;
  } catch {
    return undefined;
  }
}

/** Resolve the best available email for a lead without inventing addresses. */
export function resolveLeadEmail(lead: LeadRecord): string | undefined {
  const direct = lead.email?.trim();

  if (direct && isValidEmail(direct)) {
    return direct;
  }

  return readBusinessEmail(lead.slug);
}
