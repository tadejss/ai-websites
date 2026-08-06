type ClientContext = {
  keys(): string[];
};

const clientContext = (
  require as NodeRequire & {
    context(
      directory: string,
      useSubdirectories: boolean,
      regExp: RegExp,
    ): ClientContext;
  }
).context(".", true, /\/site\.json$/);

function isClientSiteKey(key: string): boolean {
  return /^\.\/[^/]+\/site\.json$/.test(key);
}

function clientSlugFromKey(key: string): string {
  const match = key.match(/^\.\/([^/]+)\/site\.json$/);
  return match?.[1] ?? "";
}

export const clientSlugs = clientContext
  .keys()
  .filter(isClientSiteKey)
  .map(clientSlugFromKey)
  .sort();
