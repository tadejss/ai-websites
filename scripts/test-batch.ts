import { isFatalGenerationError } from "../src/clients/fatal-error";
import { slugFromBusinessName } from "../src/clients/slug";

let failures = 0;

function check(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
  }
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

console.log("== fatal errors stop the batch ==");

const fatal = [
  "GOOGLE_PLACES_API_KEY is not configured",
  "GEMINI_API_KEY is not configured",
  "Google Places API request failed: 401",
  "429 Too Many Requests",
  "You exceeded your current quota",
  "Rate limit reached for gpt-4.1-mini",
];

for (const message of fatal) {
  check(`fatal: ${message}`, isFatalGenerationError(new Error(message)));
}

console.log("\n== per-business errors let the batch continue ==");

const recoverable = [
  'No Google Places results found for "frizer nikjer"',
  "Google Places API request failed: 500",
  "OpenAI returned invalid JSON",
  "Generated copy contains unsupported claims: hero.stats[0].value",
  'Could not create a slug from the business name ""',
  "Generated site config is incomplete: hero.stats has 0 items",
];

for (const message of recoverable) {
  check(`continues: ${message}`, !isFatalGenerationError(new Error(message)));
}

console.log("\n== slug generation is unchanged by the extraction ==");

const slugCases: Array<[string, string]> = [
  ["Avto Servis Novak d.o.o.", "avto-servis-novak"],
  [
    "Avtoservis Novak storitveno in trgovsko podjetje d.o.o.",
    "avtoservis-novak",
  ],
  ["Modri Zob - Zobozdravstveni center - Ljubljana", "modri-zob-zobozdravstveni"],
  ["Kavarna Trnovo", "kavarna-trnovo"],
  ["Linhartova dvorana, javni zavod Radovljica", "linhartova-dvorana-javni"],
  ["HC Hair Culture", "hc-hair-culture"],
  ["", ""],
];

for (const [input, expected] of slugCases) {
  const actual = slugFromBusinessName(input);
  check(`"${input}" -> "${actual}"`, actual === expected);
}

console.log(
  failures === 0 ? "\nAll batch checks passed." : `\n${failures} check(s) failed.`,
);

if (failures > 0) {
  process.exit(1);
}
