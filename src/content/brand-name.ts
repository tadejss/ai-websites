type Brand = {
  prefix: string;
  highlight: string;
};

export function formatBrandName(brand: Brand): string {
  if (!brand.highlight) {
    return brand.prefix.trim();
  }

  const needsSpace = !brand.highlight.startsWith(".");
  return `${brand.prefix}${needsSpace ? " " : ""}${brand.highlight}`.trim();
}
