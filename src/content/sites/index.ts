import { clientSlugs } from "../clients";

type SiteContext = {
  keys(): string[];
};

const siteContext = (
  require as NodeRequire & {
    context(
      directory: string,
      useSubdirectories: boolean,
      regExp: RegExp,
    ): SiteContext;
  }
).context(".", false, /\.json$/);

function isDirectSiteJson(key: string): boolean {
  return /^\.\/[^/]+\.json$/.test(key);
}

export const legacySiteSlugs = siteContext
  .keys()
  .filter(isDirectSiteJson)
  .map((key) => key.replace(/^\.\//, "").replace(/\.json$/, ""))
  .sort();

export const siteSlugs = [...new Set([...clientSlugs, ...legacySiteSlugs])].sort();
