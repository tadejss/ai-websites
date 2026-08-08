const MAX_SLUG_WORDS = 3;

const LEGAL_SUFFIX_PATTERNS = [
  /\s*,?\s*d\.?\s*o\.?\s*o\.?\s*\.?\s*$/i,
  /\s*,?\s*d\.?\s*d\.?\s*\.?\s*$/i,
  /\s*,?\s*s\.?\s*p\.?\s*\.?\s*$/i,
  /\s*,?\s*llc\s*\.?\s*$/i,
  /\s*,?\s*ltd\s*\.?\s*$/i,
];

const LEGAL_SUFFIX_WORDS = new Set(["doo", "dd", "sp", "llc", "ltd"]);

const GENERIC_COMPANY_WORDS = new Set([
  "podjetje",
  "company",
  "storitve",
  "storitveno",
  "trgovsko",
]);

const STOP_WORDS = new Set(["in", "and", "i", "the", "a", "an", "of", "for"]);

function normalizeBusinessName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function stripLegalSuffixes(text: string): string {
  let result = text;
  for (const pattern of LEGAL_SUFFIX_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}

function isMeaningfulWord(word: string): boolean {
  return (
    word.length > 0 &&
    !LEGAL_SUFFIX_WORDS.has(word) &&
    !GENERIC_COMPANY_WORDS.has(word) &&
    !STOP_WORDS.has(word)
  );
}

export function slugFromBusinessName(name: string): string {
  const normalized = stripLegalSuffixes(normalizeBusinessName(name));

  const words = normalized
    .split(/[\s/|&,]+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter(isMeaningfulWord)
    .slice(0, MAX_SLUG_WORDS);

  if (words.length === 0) {
    return "";
  }

  return words.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
