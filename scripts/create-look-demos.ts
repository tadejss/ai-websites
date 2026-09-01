import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getLooksForCategory } from "../src/catalog/looks";
import type { ImagePoolCategoryId } from "../src/images/image-pool-category";
import { validateSiteConfig } from "../src/content/validate-site-config";
import type { SiteConfig } from "../src/content/types/site";

const root = resolve(__dirname, "..");
const clientsDir = resolve(root, "src/content/clients");

const TEMPLATES: Record<
  "frizerji" | "avtomehaniki",
  { slug: string; brandHighlight: string }
> = {
  frizerji: { slug: "studio-moj-frizer", brandHighlight: "Moj Frizer" },
  avtomehaniki: { slug: "avtoservis-m-x", brandHighlight: "Avtoservis M-X" },
};

function demoSlug(lookId: string): string {
  return `look-demo-${lookId}`;
}

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function createDemoForCategory(categoryId: "frizerji" | "avtomehaniki"): string[] {
  const template = TEMPLATES[categoryId];
  const templateDir = resolve(clientsDir, template.slug);
  const baseSite = loadJson<SiteConfig>(resolve(templateDir, "site.json"));
  const baseBusiness = loadJson<Record<string, unknown>>(
    resolve(templateDir, "business.json"),
  );

  const created: string[] = [];

  for (const look of getLooksForCategory(categoryId as ImagePoolCategoryId)) {
    const slug = demoSlug(look.id);
    const clientDir = resolve(clientsDir, slug);

    if (existsSync(resolve(clientDir, "site.json"))) {
      console.log(`skip ${slug} (exists)`);
      created.push(slug);
      continue;
    }

    mkdirSync(resolve(clientDir, "assets"), { recursive: true });

    const siteConfig = validateSiteConfig({
      ...baseSite,
      lookId: look.id,
      appearance: look.appearance,
      theme: look.theme,
      layout: look.layout,
      brand: {
        ...baseSite.brand,
        highlight: `${template.brandHighlight} · ${look.displayName.split(" — ")[1] ?? look.id}`,
      },
      metadata: {
        title: `Look demo: ${look.displayName}`,
        description: `${look.description} — vizualni QA demo za katalog lookov.`,
      },
      gallery: {
        ...baseSite.gallery!,
        items: [],
      },
    });

    writeJson(resolve(clientDir, "site.json"), siteConfig);
    writeJson(resolve(clientDir, "business.json"), {
      ...baseBusiness,
      companyName: `Look Demo ${look.displayName}`,
      industry:
        categoryId === "frizerji"
          ? "Ženski frizerski salon"
          : "Avtomehanična delavnica",
    });

    console.log(`created ${slug}`);
    created.push(slug);
  }

  return created;
}

const frizerji = createDemoForCategory("frizerji");
const avtomehaniki = createDemoForCategory("avtomehaniki");
const all = [...frizerji, ...avtomehaniki];

console.log(`\nDone. ${all.length} look demos ready.`);
