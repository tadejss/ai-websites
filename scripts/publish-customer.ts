#!/usr/bin/env tsx
/**
 * Apply onboarding payload and git-publish a customer site (LIVE at /{slug}).
 *
 * Usage: npm run publish-customer -- <slug>
 */
import "dotenv/config";
import { publishCustomerSite } from "../src/onboarding/publish-customer";

async function main(): Promise<void> {
  const slug = process.argv[2]?.trim();
  if (!slug) {
    console.error("Usage: npm run publish-customer -- <slug>");
    process.exit(1);
  }

  const result = await publishCustomerSite(slug, {
    workerId: process.env.FACTORY_WORKER_ID?.trim() || "cli-customer-publish",
  });

  console.log(JSON.stringify(result, null, 2));

  if (result.outcome === "failed") {
    process.exit(1);
  }

  if (result.outcome === "busy") {
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
