/**
 * Persist templateId + curated compatible paletteId for all demo clients.
 *
 * Usage:
 *   npm run backfill-template-palette -- --dry-run
 *   npm run backfill-template-palette
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SiteConfig } from "../src/content/types/site";
import { validateSiteConfig } from "../src/content/validate-site-config";
import {
  resolveImagePoolCategory,
  type ImagePoolCategoryId,
} from "../src/images/image-pool-category";
import { assignPalette, isPaletteCompatibleWithTemplate } from "../src/templates/assign-palette";
import { assignTemplate } from "../src/templates/assign-template";
import { isTemplateId, TEMPLATE_IDS, type TemplateId } from "../src/templates/types";
import {
  CURATED_PALETTE_IDS,
  isCuratedPaletteId,
} from "../src/theme/palettes/curated";

const dryRun = process.argv.includes("--dry-run");
const verbose = process.argv.includes("--verbose");

function getClientsDir(): string {
  return resolve(process.cwd(), "src/content/clients");
}

type Counts = {
  processed: number;
  templateAlreadyValid: number;
  templateAssigned: number;
  templateRepaired: number;
  paletteAlreadyValid: number;
  paletteAssigned: number;
  paletteRepaired: number;
  compatiblePairs: number;
  incompatibleRepaired: number;
  categoryFailures: number;
  writeChanges: number;
  failed: number;
  skipped: number;
};

function emptyCounts(): Counts {
  return {
    processed: 0,
    templateAlreadyValid: 0,
    templateAssigned: 0,
    templateRepaired: 0,
    paletteAlreadyValid: 0,
    paletteAssigned: 0,
    paletteRepaired: 0,
    compatiblePairs: 0,
    incompatibleRepaired: 0,
    categoryFailures: 0,
    writeChanges: 0,
    failed: 0,
    skipped: 0,
  };
}

function resolveCategory(
  slug: string,
  clientsDir: string,
): ImagePoolCategoryId | undefined {
  const businessPath = resolve(clientsDir, slug, "business.json");
  if (!existsSync(businessPath)) {
    return undefined;
  }
  const business = JSON.parse(readFileSync(businessPath, "utf8")) as {
    industry?: string;
    companyName?: string;
  };
  return resolveImagePoolCategory({
    industry: business.industry,
    companyName: business.companyName,
  });
}

function planAssignment(
  slug: string,
  site: SiteConfig,
  categoryId: ImagePoolCategoryId | undefined,
): {
  templateId: TemplateId;
  paletteId: string;
  templateAction: "preserve" | "assign" | "repair";
  paletteAction: "preserve" | "assign" | "repair";
  incompatibleRepaired: boolean;
} {
  let templateId: TemplateId;
  let templateAction: "preserve" | "assign" | "repair";

  if (isTemplateId(site.templateId)) {
    templateId = site.templateId;
    templateAction = "preserve";
  } else if (site.templateId) {
    templateId = assignTemplate({ slug, categoryId });
    templateAction = "repair";
  } else {
    templateId = assignTemplate({ slug, categoryId });
    templateAction = "assign";
  }

  const currentPalette = site.theme?.paletteId;
  const compatible = isPaletteCompatibleWithTemplate(currentPalette, {
    templateId,
    categoryId,
  });

  let paletteId: string;
  let paletteAction: "preserve" | "assign" | "repair";
  let incompatibleRepaired = false;

  if (compatible && currentPalette) {
    paletteId = currentPalette;
    paletteAction = "preserve";
  } else if (currentPalette && isCuratedPaletteId(currentPalette)) {
    paletteId = assignPalette({ slug, categoryId, templateId });
    paletteAction = "repair";
    incompatibleRepaired = true;
  } else if (currentPalette) {
    paletteId = assignPalette({ slug, categoryId, templateId });
    paletteAction = "repair";
  } else {
    paletteId = assignPalette({ slug, categoryId, templateId });
    paletteAction = "assign";
  }

  return {
    templateId,
    paletteId,
    templateAction,
    paletteAction,
    incompatibleRepaired,
  };
}

async function main(): Promise<void> {
  const clientsDir = getClientsDir();
  const counts = emptyCounts();
  const templateDist = Object.fromEntries(
    TEMPLATE_IDS.map((id) => [id, 0]),
  ) as Record<TemplateId, number>;
  const paletteDist = Object.fromEntries(
    CURATED_PALETTE_IDS.map((id) => [id, 0]),
  ) as Record<string, number>;

  const entries = readdirSync(clientsDir, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory(),
  );

  for (const entry of entries) {
    const slug = entry.name;
    const sitePath = resolve(clientsDir, slug, "site.json");
    if (!existsSync(sitePath)) {
      counts.skipped += 1;
      continue;
    }

    counts.processed += 1;

    try {
      const site = JSON.parse(readFileSync(sitePath, "utf8")) as SiteConfig;
      const categoryId = resolveCategory(slug, clientsDir);
      if (!categoryId) {
        counts.categoryFailures += 1;
        if (verbose || !existsSync(resolve(clientsDir, slug, "business.json"))) {
          console.warn(`[category] ${slug}: unresolved`);
        } else {
          console.warn(`[category] ${slug}: unresolved`);
        }
      }

      const plan = planAssignment(slug, site, categoryId);

      if (plan.templateAction === "preserve") counts.templateAlreadyValid += 1;
      if (plan.templateAction === "assign") counts.templateAssigned += 1;
      if (plan.templateAction === "repair") counts.templateRepaired += 1;

      if (plan.paletteAction === "preserve") counts.paletteAlreadyValid += 1;
      if (plan.paletteAction === "assign") counts.paletteAssigned += 1;
      if (plan.paletteAction === "repair") counts.paletteRepaired += 1;
      if (plan.incompatibleRepaired) counts.incompatibleRepaired += 1;

      templateDist[plan.templateId] += 1;
      paletteDist[plan.paletteId] = (paletteDist[plan.paletteId] ?? 0) + 1;

      const templateChanged = site.templateId !== plan.templateId;
      const paletteChanged = site.theme?.paletteId !== plan.paletteId;
      const needsWrite = templateChanged || paletteChanged;

      if (!needsWrite) {
        counts.compatiblePairs += 1;
        continue;
      }

      const next: SiteConfig = {
        ...site,
        templateId: plan.templateId,
        theme: {
          ...(site.theme ?? { paletteId: plan.paletteId }),
          paletteId: plan.paletteId,
        },
      };

      const validated = validateSiteConfig(next);

      if (
        !isTemplateId(validated.templateId) ||
        !isCuratedPaletteId(validated.theme?.paletteId ?? "") ||
        !isPaletteCompatibleWithTemplate(validated.theme?.paletteId, {
          templateId: validated.templateId,
          categoryId,
        })
      ) {
        throw new Error(
          `invalid pair after validate: template=${validated.templateId} palette=${validated.theme?.paletteId}`,
        );
      }

      counts.writeChanges += 1;

      if (!dryRun) {
        writeFileSync(
          sitePath,
          `${JSON.stringify(validated, null, 2)}\n`,
          "utf8",
        );
      }

      if (verbose) {
        console.log(
          `[${dryRun ? "plan" : "write"}] ${slug}: ${site.templateId ?? "(none)"}→${plan.templateId}, ${site.theme?.paletteId ?? "(none)"}→${plan.paletteId}`,
        );
      }
    } catch (error) {
      counts.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[fail] ${slug}: ${message}`);
    }
  }

  console.log(`\n=== backfill-template-palette${dryRun ? " (dry-run)" : ""} ===`);
  console.log(`Total clients: ${counts.processed}`);
  console.log(`Template already valid: ${counts.templateAlreadyValid}`);
  console.log(`Template assigned: ${counts.templateAssigned}`);
  console.log(`Template repaired: ${counts.templateRepaired}`);
  console.log(`Palette already valid: ${counts.paletteAlreadyValid}`);
  console.log(`Palette assigned: ${counts.paletteAssigned}`);
  console.log(`Palette repaired: ${counts.paletteRepaired}`);
  console.log(`Compatible pairs (no write): ${counts.compatiblePairs}`);
  console.log(`Incompatible pairs repaired: ${counts.incompatibleRepaired}`);
  console.log(`Category resolution failures: ${counts.categoryFailures}`);
  console.log(`Write changes planned: ${counts.writeChanges}`);
  console.log(`Clients skipped: ${counts.skipped}`);
  console.log(`Clients failed: ${counts.failed}`);

  console.log(`\n--- Templates ---`);
  for (const id of TEMPLATE_IDS) {
    console.log(`${id}: ${templateDist[id]}`);
  }

  console.log(`\n--- Palettes ---`);
  for (const id of CURATED_PALETTE_IDS) {
    console.log(`${id}: ${paletteDist[id] ?? 0}`);
  }

  if (counts.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
