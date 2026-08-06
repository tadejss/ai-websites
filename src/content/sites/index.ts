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

export const siteSlugs = siteContext
  .keys()
  .map((key) => key.replace(/^\.\//, "").replace(/\.json$/, ""))
  .sort();
