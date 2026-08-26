/**
 * Extract a first name for demo purchase-bar personalization from Slovenian
 * business names (mostly s.p. register strings) or a brand highlight.
 */

const BUSINESS_WORDS = new Set(
  [
    "frizerski",
    "frizersko",
    "frizerstvo",
    "frizer",
    "frizerke",
    "salon",
    "studio",
    "beauty",
    "lepotni",
    "lepotilni",
    "lepotne",
    "kozmetični",
    "kozmeticni",
    "kozmetične",
    "atelje",
    "brivnica",
    "brivsko",
    "barber",
    "barbershop",
    "keramičarstvo",
    "keramicarstvo",
    "keramike",
    "keramika",
    "polaganje",
    "elektro",
    "elektroinstalacije",
    "elektroinštalacije",
    "elektrotehnika",
    "elektroservis",
    "instalacije",
    "inštalacije",
    "storitve",
    "gradbeništvo",
    "gradbenistvo",
    "gradbena",
    "podjetje",
    "trgovina",
    "trgovsko",
    "montaža",
    "montaza",
    "vulkanizerstvo",
    "servis",
    "servisno",
    "servisne",
    "proizvodno",
    "posredništvo",
    "posrednistvo",
    "obdelava",
    "zaključna",
    "zakljucna",
    "dela",
    "okrasna",
    "uporabna",
    "strojni",
    "ometi",
    "hitri",
    "druge",
    "by",
    "pe",
    "pc",
    "in",
    "za",
    "z",
    "na",
    "the",
    "trade",
    "look",
    "style",
    "styling",
    "styl",
    "direct",
    "extreme",
    "daily",
    "old",
    "school",
    "cut4u",
    "glamur",
    "atmosfera",
    "natura",
    "frizura",
    "oaza",
    "lepote",
    "dama",
    "diamond",
    "lamia",
    "havajana",
    "epiks",
    "luxiaz",
    "modno",
    "žensko",
    "zensko",
    "moško",
    "mosko",
    "otroško",
    "otrosko",
    "line",
    "cosmetic",
    "masaže",
    "masaža",
    "masaza",
    "m",
    "hd",
    "bs",
    "as",
    "do",
    "doo",
    "sp",
    "ljubljana",
    "center",
    "maribor",
    "cerknica",
    "sežana",
    "sezana",
    "kranj",
    "lesce",
    "material",
    "construction",
    "store",
    "prodaja",
  ].map((w) => w.toLocaleLowerCase("sl")),
);

function stripLegalForms(value: string): string {
  return value
    .replace(/\bs\.?\s*p\.?\b/gi, " ")
    .replace(/\bd\.?\s*o\.?\s*o\.?\b/gi, " ")
    .replace(/\bd\.?\s*n\.?\s*o\.?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanToken(token: string): string {
  return token.replace(/^["«»„“”']+|["«»„“”',.]+$/g, "").trim();
}

export function titleCasePersonName(word: string): string {
  const lower = word.toLocaleLowerCase("sl");
  if (!lower) {
    return word;
  }
  return lower.charAt(0).toLocaleUpperCase("sl") + lower.slice(1);
}

function isPlausibleFirstName(word: string): boolean {
  const cleaned = cleanToken(word);
  if (cleaned.length < 2 || cleaned.length > 18) {
    return false;
  }
  if (!/^[\p{L}]+$/u.test(cleaned)) {
    return false;
  }
  if (BUSINESS_WORDS.has(cleaned.toLocaleLowerCase("sl"))) {
    return false;
  }
  return true;
}

function isSurnameLike(word: string): boolean {
  const cleaned = cleanToken(word);
  if (!cleaned || !/^[\p{L}-]+$/u.test(cleaned)) {
    return false;
  }
  return !BUSINESS_WORDS.has(cleaned.toLocaleLowerCase("sl"));
}

function dedupeConsecutive(words: string[]): string[] {
  const result: string[] = [];
  for (const word of words) {
    const prev = result[result.length - 1];
    if (
      prev &&
      prev.toLocaleLowerCase("sl") === word.toLocaleLowerCase("sl")
    ) {
      continue;
    }
    result.push(word);
  }
  return result;
}

function tokenize(segment: string): string[] {
  return dedupeConsecutive(
    segment
      .split(/\s+/)
      .map(cleanToken)
      .filter(Boolean),
  );
}

/** FirstName (+ optional compound surname) in a token list (AJPES owner pattern). */
function firstNameFromPersonPair(rawWords: string[]): string | null {
  const words = rawWords.map(cleanToken).filter(Boolean);
  if (words.length < 2) {
    return null;
  }

  // "Katja Katja Trontelj Potočar" — duplicated given name is a strong signal.
  for (let i = 0; i < words.length - 1; i += 1) {
    if (
      words[i].toLocaleLowerCase("sl") === words[i + 1].toLocaleLowerCase("sl") &&
      isPlausibleFirstName(words[i])
    ) {
      return titleCasePersonName(words[i]);
    }
  }

  const tokens = dedupeConsecutive(words);
  if (tokens.length < 2) {
    return null;
  }

  // Prefer the rightmost FirstName LastName pair ("… Jelka Rudi Redek" → Rudi).
  for (let i = tokens.length - 2; i >= 0; i -= 1) {
    if (!isPlausibleFirstName(tokens[i])) {
      continue;
    }
    const rest = tokens.slice(i + 1);
    if (rest.length === 0 || !rest.every(isSurnameLike)) {
      continue;
    }
    // Skip if another given-name-like token sits in the remainder (scan further right).
    if (rest.length > 1 && rest.slice(0, -1).some(isPlausibleFirstName)) {
      continue;
    }
    return titleCasePersonName(tokens[i]);
  }

  return null;
}

function hasBusinessWord(tokens: string[]): boolean {
  return tokens.some((token) =>
    BUSINESS_WORDS.has(token.toLocaleLowerCase("sl")),
  );
}

function firstNameFromSegment(
  segment: string,
  options: { allowBrandName: boolean },
): string | null {
  const rawWords = segment.split(/\s+/);
  const fromPair = firstNameFromPersonPair(rawWords);
  if (fromPair) {
    return fromPair;
  }

  const tokens = tokenize(segment);
  if (tokens.length === 0) {
    return null;
  }

  // "Frizerski studio Kim" / "BEAUTY BY ŠPELA" — one personal token with business words.
  const plausible = tokens.filter(isPlausibleFirstName);
  if (
    options.allowBrandName &&
    plausible.length === 1 &&
    hasBusinessWord(tokens) &&
    tokens.length > 1
  ) {
    return titleCasePersonName(plausible[0]);
  }

  if (options.allowBrandName && plausible.length > 1 && hasBusinessWord(tokens)) {
    return titleCasePersonName(plausible[plausible.length - 1]);
  }

  return null;
}

function extractFromCompanyName(companyName: string): string | null {
  const hadSoleProp = /\bs\.?\s*p\.?\b/i.test(companyName);
  const stripped = stripLegalForms(companyName);
  if (!stripped) {
    return null;
  }

  const segments = stripped
    .split(/[,–—|/]+|\s+-\s*|-(?=\p{Lu})/u)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  // Prefer segments that contain a FirstName LastName pair.
  const pairHits: string[] = [];
  const softHits: string[] = [];

  for (const segment of segments) {
    const pair = firstNameFromPersonPair(segment.split(/\s+/));
    if (pair) {
      pairHits.push(pair);
      continue;
    }
    const soft = firstNameFromSegment(segment, {
      allowBrandName: true,
    });
    if (soft) {
      softHits.push(soft);
    }
  }

  if (pairHits.length > 0) {
    // For s.p. with multiple pairs, the owner is usually the last pair segment.
    return hadSoleProp ? pairHits[pairHits.length - 1] : pairHits[0];
  }

  if (hadSoleProp && softHits.length > 0) {
    return softHits[softHits.length - 1];
  }

  // Non-s.p.: only soft hits that came from business+name patterns.
  if (!hadSoleProp && softHits.length === 1) {
    return softHits[0];
  }

  return null;
}

function extractFromBrandHighlight(brandHighlight: string): string | null {
  const tokens = brandHighlight
    .trim()
    .split(/\s+/)
    .map(cleanToken)
    .filter(Boolean);

  const pair = firstNameFromPersonPair(tokens);
  if (pair) {
    return pair;
  }

  // Prefer the last token ("Extreme Jasmina" → Jasmina, "ŠPELA" → Špela).
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    if (isPlausibleFirstName(tokens[i])) {
      return titleCasePersonName(tokens[i]);
    }
  }
  return null;
}

export function extractOwnerFirstName(
  companyName?: string | null,
  brandHighlight?: string | null,
): string | null {
  if (companyName?.trim()) {
    const fromCompany = extractFromCompanyName(companyName.trim());
    if (fromCompany) {
      return fromCompany;
    }
  }

  if (brandHighlight?.trim()) {
    return extractFromBrandHighlight(brandHighlight.trim());
  }

  return null;
}

export function purchaseBarHeadline(firstName: string | null): string {
  if (firstName) {
    return `${firstName}, tvoja nova stran je pripravljena.`;
  }
  return "Tvoja nova stran je pripravljena.";
}

export function purchaseBarSubtitle(plan: "monthly" | "yearly"): string {
  if (plan === "yearly") {
    return "Gostovanje, vzdrževanje, posodobitve in domena so vključeni!";
  }
  return "Gostovanje, vzdrževanje in posodobitve so vključene!";
}
