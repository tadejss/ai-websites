import {
  collectVisibleCopy,
  findUnsupportedClaims,
} from "@/ai/validate-claims";
import { findQualityProblems } from "@/ai/validate-generated-site-config";
import type { BusinessInput } from "@/ai/types";
import type { SiteConfig } from "@/content/types/site";
import { validateSiteConfig } from "@/content/validate-site-config";
import type { LeadRecord } from "@/leads/store";
import type {
  DeterministicChecks,
  IdentityDiff,
  QaIssue,
} from "./types";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

export function extractCity(address: string | null | undefined): string | null {
  if (!address?.trim()) {
    return null;
  }
  const parts = address
    .split(",")
    .map((part) => part.replace(/\bslovenia\b/i, "").replace(/\d{4}/g, "").trim())
    .filter(Boolean);
  return parts.at(-1) || null;
}

function brandName(config: SiteConfig): string {
  return `${config.brand.prefix} ${config.brand.highlight}`.replace(/\s+/g, " ").trim();
}

function namesMatch(expected: string, actual: string): boolean {
  const left = normalizeText(expected);
  const right = normalizeText(actual);
  if (!left || !right) {
    return true;
  }
  return right.includes(left) || left.includes(right);
}

function findContactValue(
  config: SiteConfig,
  matcher: (item: { label: string; value: string; icon: string }) => boolean,
): string | null {
  const item = config.contact.items.find(matcher);
  return item?.value ?? null;
}

export function runDeterministicChecks(input: {
  site: unknown;
  business: BusinessInput;
  lead: LeadRecord | null;
}): DeterministicChecks {
  let schemaValid = true;
  let schemaError: string | null = null;
  let site: SiteConfig | null = null;

  try {
    site = validateSiteConfig(input.site);
  } catch (error) {
    schemaValid = false;
    schemaError = error instanceof Error ? error.message : String(error);
  }

  if (!site) {
    return {
      schemaValid,
      schemaError,
      qualityProblems: [],
      unsupportedClaims: [],
      identityDiffs: [],
      brokenAnchors: [],
      missingImageKeys: [],
    };
  }

  const qualityProblems = findQualityProblems(site);
  const unsupportedClaims = findUnsupportedClaims(site, input.business);
  const identityDiffs: IdentityDiff[] = [];

  const expectedName =
    input.lead?.companyName?.trim() || input.business.companyName?.trim() || "";
  const actualName = brandName(site);
  if (!expectedName) {
    identityDiffs.push({
      field: "companyName",
      expected: "",
      actual: actualName,
      kind: "unknown",
    });
  } else if (
    !namesMatch(expectedName, actualName) &&
    !namesMatch(expectedName, site.metadata.title)
  ) {
    identityDiffs.push({
      field: "companyName",
      expected: expectedName,
      actual: actualName,
      kind: "mismatch",
    });
  }

  const expectedPhone =
    input.lead?.phone?.trim() || input.business.phone?.trim() || "";
  const actualPhone = findContactValue(
    site,
    (item) => item.icon === "phone" || /telefon/i.test(item.label),
  );
  if (!expectedPhone) {
    identityDiffs.push({
      field: "phone",
      expected: "",
      actual: actualPhone ?? "",
      kind: "unknown",
    });
  } else if (
    !actualPhone ||
    normalizePhone(expectedPhone) !== normalizePhone(actualPhone)
  ) {
    identityDiffs.push({
      field: "phone",
      expected: expectedPhone,
      actual: actualPhone ?? "",
      kind: "mismatch",
    });
  }

  const expectedAddress =
    input.lead?.address?.trim() || input.business.address?.trim() || "";
  const actualAddress =
    findContactValue(
      site,
      (item) => item.icon === "location" || /naslov|lokacija/i.test(item.label),
    ) || site.footer.address;
  if (!expectedAddress) {
    identityDiffs.push({
      field: "address",
      expected: "",
      actual: actualAddress ?? "",
      kind: "unknown",
    });
  } else if (
    actualAddress &&
    !normalizeText(actualAddress).includes(
      normalizeText(expectedAddress).slice(0, 24),
    ) &&
    !normalizeText(expectedAddress).includes(
      normalizeText(actualAddress).slice(0, 24),
    )
  ) {
    identityDiffs.push({
      field: "address",
      expected: expectedAddress,
      actual: actualAddress,
      kind: "mismatch",
    });
  }

  const expectedHours = input.business.openingHours?.trim() || "";
  const actualHours = findContactValue(
    site,
    (item) => item.icon === "clock" || /ur[ae]|odprt/i.test(item.label),
  );
  if (!expectedHours) {
    identityDiffs.push({
      field: "openingHours",
      expected: "",
      actual: actualHours ?? "",
      kind: "unknown",
    });
  }

  const expectedCity =
    extractCity(expectedAddress) || input.business.serviceArea?.trim() || null;
  if (expectedCity) {
    const haystack = normalizeText(
      [
        site.metadata.title,
        site.metadata.description,
        site.hero.title,
        site.hero.titleHighlight,
        site.hero.description,
        actualAddress ?? "",
        site.footer.address,
      ].join(" "),
    );
    if (!haystack.includes(normalizeText(expectedCity))) {
      identityDiffs.push({
        field: "city",
        expected: expectedCity,
        actual: site.metadata.title,
        kind: "mismatch",
      });
    }
  } else {
    identityDiffs.push({
      field: "city",
      expected: "",
      actual: "",
      kind: "unknown",
    });
  }

  const sectionIds = new Set(
    [
      site.services.id,
      site.whyChooseUs.id,
      site.contact.id,
      site.pricing?.id,
      site.gallery?.id,
    ].filter(Boolean),
  );
  const brokenAnchors = site.nav.links
    .filter((link) => link.href.startsWith("#"))
    .map((link) => link.href.slice(1))
    .filter((id) => id && !sectionIds.has(id));

  const missingImageKeys: string[] = [];
  if (site.images) {
    if (!site.images.hero?.src) missingImageKeys.push("images.hero.src");
    if (!site.images.services?.src) missingImageKeys.push("images.services.src");
  }

  return {
    schemaValid,
    schemaError,
    qualityProblems,
    unsupportedClaims,
    identityDiffs,
    brokenAnchors,
    missingImageKeys,
  };
}

export function deterministicIssuesFromChecks(
  checks: DeterministicChecks,
): QaIssue[] {
  const issues: QaIssue[] = [];
  let index = 0;
  const nextId = () => `DET-${String((index += 1)).padStart(3, "0")}`;

  if (!checks.schemaValid) {
    issues.push({
      id: nextId(),
      severity: "critical",
      category: "technical",
      type: "schema_invalid",
      field: "site.json",
      message: "Persisted site.json failed Zod validation",
      evidence: checks.schemaError ?? "",
      expected: "valid SiteConfig",
      actual: checks.schemaError ?? "invalid",
      confidence: 1,
      verificationStatus: "verified",
      autoFixable: false,
      recommendedFix: "Regenerate the site config so it matches the schema",
    });
  }

  for (const problem of checks.qualityProblems) {
    issues.push({
      id: nextId(),
      severity: "medium",
      category: "technical",
      type: "quality_problem",
      field: problem.split(" ")[0] ?? "site",
      message: problem,
      evidence: problem,
      expected: "quality bounds satisfied",
      actual: problem,
      confidence: 1,
      verificationStatus: "verified",
      autoFixable: false,
      recommendedFix: "Fix the listed quality bound in site copy",
    });
  }

  for (const claim of checks.unsupportedClaims) {
    issues.push({
      id: nextId(),
      severity: "high",
      category: "content",
      type: "unsupported_claim",
      field: claim.field,
      message: claim.reason,
      evidence: claim.value,
      expected: "claim supported by business.json",
      actual: claim.value,
      confidence: 1,
      verificationStatus: "verified",
      autoFixable: false,
      recommendedFix: "Remove or rewrite the unsupported claim",
    });
  }

  for (const diff of checks.identityDiffs) {
    if (diff.kind === "unknown") {
      continue;
    }
    const type =
      diff.field === "phone"
        ? "wrong_phone"
        : diff.field === "companyName"
          ? "wrong_business_name"
          : diff.field === "city"
            ? "wrong_city"
            : diff.field === "address"
              ? "wrong_address"
              : "wrong_contact";
    issues.push({
      id: nextId(),
      severity: diff.field === "phone" || diff.field === "companyName" ? "critical" : "high",
      category: "business",
      type,
      field: diff.field,
      message: `Site ${diff.field} does not match known business data`,
      evidence: `Research ${diff.field}: ${diff.expected}`,
      expected: diff.expected,
      actual: diff.actual,
      confidence: 1,
      verificationStatus: "verified",
      autoFixable: false,
      recommendedFix: `Set ${diff.field} to the known business value`,
    });
  }

  for (const anchor of checks.brokenAnchors) {
    issues.push({
      id: nextId(),
      severity: "medium",
      category: "technical",
      type: "broken_anchor",
      field: "nav.links",
      message: `Nav href #${anchor} does not match a section id`,
      evidence: `#${anchor}`,
      expected: "href target matches a section id",
      actual: `#${anchor}`,
      confidence: 1,
      verificationStatus: "verified",
      autoFixable: false,
      recommendedFix: "Point the nav link at an existing section id",
    });
  }

  for (const key of checks.missingImageKeys) {
    issues.push({
      id: nextId(),
      severity: "medium",
      category: "technical",
      type: "missing_image",
      field: key,
      message: `Missing image asset key ${key}`,
      evidence: key,
      expected: "image src present",
      actual: "",
      confidence: 1,
      verificationStatus: "verified",
      autoFixable: false,
      recommendedFix: "Regenerate site images for the missing slot",
    });
  }

  return issues;
}

export function collectSiteCopyEntries(config: SiteConfig): Array<[string, string]> {
  return collectVisibleCopy(config);
}
