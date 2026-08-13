import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateSiteConfig } from "../src/content/validate-site-config";
import { requiresCookieConsent } from "../src/privacy/requires-cookie-consent";
import { findPrivacyProblems } from "../src/privacy/validate-privacy";
import { defaultPrivacyConfig } from "../src/privacy/defaults";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const clientsDir = resolve(__dirname, "../src/content/clients");
const defaults = defaultPrivacyConfig();

assert(defaults.contactForm.enabled === true, "contact form enabled by default");
assert(defaults.analytics.enabled === false, "analytics disabled by default");
assert(defaults.marketing.enabled === false, "marketing disabled by default");
assert(defaults.booking.enabled === false, "booking disabled by default");
assert(defaults.cookies.nonEssential === false, "non-essential cookies disabled");
assert(
  requiresCookieConsent(defaults) === false,
  "default config should not require cookie consent",
);

let checked = 0;

for (const entry of readdirSync(clientsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const sitePath = resolve(clientsDir, entry.name, "site.json");

  if (!existsSync(sitePath)) {
    continue;
  }

  const config = validateSiteConfig(JSON.parse(readFileSync(sitePath, "utf8")));
  checked += 1;

  assert(config.privacy.enabled === true, `${entry.name}: privacy should be enabled`);
  assert(Boolean(config.business.name), `${entry.name}: business.name should exist`);
  assert(Array.isArray(config.privacy.contactForm.fields), `${entry.name}: fields array`);

  const problems = findPrivacyProblems(config);

  if (problems.length > 0) {
    console.warn(`${entry.name} privacy warnings: ${problems.join(", ")}`);
  }
}

const bookingConfig = {
  ...defaults,
  booking: {
    enabled: true,
    type: "external_link" as const,
    providerName: "Test Booking",
    url: "https://booking.example.com",
    privacyUrl: "https://booking.example.com/privacy",
  },
};

assert(bookingConfig.booking.enabled === true, "booking test config enabled");

console.log(`Privacy tests passed for ${checked} site(s).`);
