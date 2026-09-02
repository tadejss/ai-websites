import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { getLooksForCategory } from "../src/catalog/looks";
import {
  IMAGE_POOL_CATEGORY_IDS,
  type ImagePoolCategoryId,
} from "../src/images/image-pool-category";
import { validateSiteConfig } from "../src/content/validate-site-config";
import type { SiteConfig } from "../src/content/types/site";

const root = resolve(__dirname, "..");
const clientsDir = resolve(root, "src/content/clients");

/** QA catalog demos use `qa-{lookId}` — never business-name slugs. */
export const QA_LOOK_SLUG_PREFIX = "qa";

/** Source client per category (content + images only; not used in slug). */
export const CATEGORY_QA_TEMPLATES: Record<
  ImagePoolCategoryId,
  { slug: string; industryLabel: string }
> = {
  frizerji: {
    slug: "studio-moj-frizer",
    industryLabel: "Ženski frizerski salon",
  },
  kozmeticarji: {
    slug: "kozmeticni-salon-lila",
    industryLabel: "Kozmetični salon",
  },
  "nohti-pedikura": {
    slug: "valnailsstudio",
    industryLabel: "Salon za nohte",
  },
  "maserji-wellness": {
    slug: "masaze-lavanda-masazne",
    industryLabel: "Masažne storitve",
  },
  vulkanizerji: {
    slug: "vulkanizerstvo-izdelava-kljucev",
    industryLabel: "Avtovulkanizerstvo",
  },
  "avtokleparji-licarji": {
    slug: "avtokleparstvo-avtolicarstvo-stanislav",
    industryLabel: "Avtokleparstvo in avtoličarstvo",
  },
  avtomehaniki: {
    slug: "avtoservis-m-x",
    industryLabel: "Avtomehanična delavnica",
  },
  "vodovodarji-ogrevanje": {
    slug: "vodovodne-instalacije-marjan",
    industryLabel: "Vodovodne inštalacije",
  },
  elektricarji: {
    slug: "elvip-elektroinstalacije-podboj",
    industryLabel: "Elektroinštalacije",
  },
  keramicarji: {
    slug: "keramicarstvo-mubi-igor",
    industryLabel: "Keramičarske storitve",
  },
  slikopleskarji: {
    slug: "slikopleskarstvo-nagelj-srecko",
    industryLabel: "Slikopleskarstvo",
  },
  suhomontazerji: {
    slug: "zakljucna-dela-v",
    industryLabel: "Suhomontažna gradnja",
  },
  "mizarji-tesarji": {
    slug: "mizarstvo-podkriznik-matjaz",
    industryLabel: "Mizarstvo",
  },
  "parketarji-talne-obloge": {
    slug: "gradbenistvo-matkovic-zakljucna",
    industryLabel: "Talne obloge in gradbena dela",
  },
  gradbinci: {
    slug: "gradbenistvo-matkovic-zakljucna",
    industryLabel: "Gradbena dela",
  },
  "cistilni-servisi": {
    slug: "cistilni-servis-zangor",
    industryLabel: "Čistilni servis",
  },
};

export function qaSlugForLook(lookId: string): string {
  return `${QA_LOOK_SLUG_PREFIX}-${lookId}`;
}

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function removeLegacyLookDemoClients(): number {
  let removed = 0;

  for (const entry of readdirSync(clientsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("look-demo-")) {
      continue;
    }

    rmSync(resolve(clientsDir, entry.name), { recursive: true, force: true });
    console.log(`removed legacy ${entry.name}`);
    removed += 1;
  }

  return removed;
}

function createDemosForCategory(categoryId: ImagePoolCategoryId): string[] {
  const template = CATEGORY_QA_TEMPLATES[categoryId];
  const templateDir = resolve(clientsDir, template.slug);

  if (!existsSync(resolve(templateDir, "site.json"))) {
    throw new Error(`Template missing site.json: ${template.slug}`);
  }

  const baseSite = loadJson<SiteConfig>(resolve(templateDir, "site.json"));
  const baseBusiness = loadJson<Record<string, unknown>>(
    resolve(templateDir, "business.json"),
  );
  const lookLabel = categoryId.replace(/-/g, " ");

  const created: string[] = [];

  for (const look of getLooksForCategory(categoryId)) {
    const slug = qaSlugForLook(look.id);
    const clientDir = resolve(clientsDir, slug);
    const archetypeLabel =
      look.displayName.split(" — ")[1] ?? look.id.split("-").slice(2).join(" ");

    mkdirSync(resolve(clientDir, "assets"), { recursive: true });

    const siteConfig = validateSiteConfig({
      ...baseSite,
      lookId: look.id,
      appearance: look.appearance,
      theme: look.theme,
      layout: look.layout,
      brand: {
        ...baseSite.brand,
        prefix: "QA",
        highlight: `${lookLabel} · ${archetypeLabel}`,
      },
      metadata: {
        title: `QA katalog: ${look.displayName}`,
        description: `${look.description} — notranji QA preview (ne lead).`,
      },
      gallery: baseSite.gallery
        ? { ...baseSite.gallery, items: [] }
        : undefined,
    });

    writeJson(resolve(clientDir, "site.json"), siteConfig);
    writeJson(resolve(clientDir, "business.json"), {
      ...baseBusiness,
      companyName: `QA Katalog · ${look.displayName}`,
      industry: template.industryLabel,
    });

    console.log(`created ${slug}`);
    created.push(slug);
  }

  return created;
}

const removed = removeLegacyLookDemoClients();
const all: string[] = [];

for (const categoryId of IMAGE_POOL_CATEGORY_IDS) {
  all.push(...createDemosForCategory(categoryId));
}

console.log(
  `\nDone. Removed ${removed} legacy look-demo clients. ${all.length} QA catalog pages at qa-{lookId}.`,
);
