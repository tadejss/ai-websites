import { ZodError } from "zod";
import { applyQaPolicy, buildQaResult, scoreQaIssues } from "../src/qa/policy";
import { parseGrokQaOutput, parseGrokQaOutputJson } from "../src/qa/schemas";
import { shouldSkipAutomaticQa } from "../src/qa/store";
import { isQaRetryable, QaFatalError, QaRetryableError } from "../src/qa/errors";
import {
  extractCity,
  normalizePhone,
  runDeterministicChecks,
  deterministicIssuesFromChecks,
} from "../src/qa/deterministic";
import { mergeQaIssues, runQaAgent } from "../src/qa/agent";
import { loadGeneratedSite } from "../src/qa/build-input";
import { readLead } from "../src/leads/store";
import type { GrokStructuredClient, QaIssue } from "../src/qa/types";

let failures = 0;

function ok(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
    console.log(`FAIL  ${label}`);
    return;
  }
  console.log(`PASS  ${label}`);
}

function issue(overrides: Partial<QaIssue> = {}): QaIssue {
  return {
    id: "QA-001",
    severity: "low",
    category: "content",
    type: "language",
    field: "hero.title",
    message: "test",
    evidence: "e",
    expected: "x",
    actual: "y",
    confidence: 0.9,
    verificationStatus: "verified",
    autoFixable: false,
    recommendedFix: "rewrite",
    ...overrides,
  };
}

function testSchema(): void {
  console.log("== schema ==");

  const pass = parseGrokQaOutput({
    summary: "Looks good",
    issues: [],
  });
  ok("valid PASS payload (no issues)", pass.issues.length === 0);

  const fail = parseGrokQaOutput({
    summary: "Wrong phone",
    issues: [
      issue({
        severity: "critical",
        type: "wrong_phone",
        category: "business",
      }),
    ],
  });
  ok("valid FAIL payload parses", fail.issues[0]?.severity === "critical");

  let malformed = false;
  try {
    parseGrokQaOutputJson("{not json");
  } catch {
    malformed = true;
  }
  ok("malformed JSON is rejected", malformed);

  let unknownEnum = false;
  try {
    parseGrokQaOutput({
      summary: "x",
      issues: [{ ...issue(), severity: "catastrophic" }],
    });
  } catch (error) {
    unknownEnum = error instanceof ZodError;
  }
  ok("unknown enum is rejected", unknownEnum);

  let badConfidence = false;
  try {
    parseGrokQaOutput({
      summary: "x",
      issues: [{ ...issue(), confidence: 1.4 }],
    });
  } catch {
    badConfidence = true;
  }
  ok("invalid confidence is rejected", badConfidence);

  let forbiddenPublish = false;
  try {
    parseGrokQaOutputJson(
      JSON.stringify({
        summary: "ok",
        issues: [],
        publish: true,
      }),
    );
  } catch {
    forbiddenPublish = true;
  }
  ok("publish field is rejected", forbiddenPublish);
}

function testPolicy(): void {
  console.log("== policy ==");

  ok(
    "critical → fail",
    applyQaPolicy([issue({ severity: "critical" })]) === "fail",
  );
  ok("high → fail", applyQaPolicy([issue({ severity: "high" })]) === "fail");
  ok(
    "medium default → warning",
    applyQaPolicy([issue({ severity: "medium" })], false) === "warning",
  );
  ok(
    "medium configured → fail",
    applyQaPolicy([issue({ severity: "medium" })], true) === "fail",
  );
  ok(
    "low-only → warning",
    applyQaPolicy([issue({ severity: "low" })]) === "warning",
  );
  ok("no issues → pass", applyQaPolicy([]) === "pass");

  const grokSaysPass = buildQaResult("all good", [
    issue({ severity: "critical", type: "wrong_phone" }),
  ]);
  ok(
    "model cannot override policy",
    grokSaysPass.policyStatus === "fail" && grokSaysPass.score < 100,
  );
  ok("score is computed in code", scoreQaIssues([]) === 100);
}

function testDeterministic(): void {
  console.log("== deterministic ==");

  ok("normalize phone strips spaces", normalizePhone("+386 41 123 456") === "+38641123456");
  ok("extract city from address", extractCity("Devinska ulica 1c, 1000 Ljubljana, Slovenia") === "Ljubljana");

  const { site, business } = loadGeneratedSite("kavarna-trnovo");
  const lead = readLead("kavarna-trnovo");
  const baseline = runDeterministicChecks({ site, business, lead });
  ok(
    "unknown phone is not a mismatch",
    baseline.identityDiffs
      .filter((diff) => diff.field === "phone")
      .every((diff) => diff.kind === "unknown"),
  );

  const wrongPhone = runDeterministicChecks({
    site: {
      ...site,
      contact: {
        ...site.contact,
        items: site.contact.items.map((item) =>
          item.icon === "phone"
            ? { ...item, value: "+386 41 999 999" }
            : item,
        ),
      },
    },
    business: { ...business, phone: "+386 41 111 111" },
    lead: lead ? { ...lead, phone: "+386 41 111 111" } : null,
  });
  ok(
    "wrong phone is a mismatch",
    wrongPhone.identityDiffs.some(
      (diff) => diff.field === "phone" && diff.kind === "mismatch",
    ),
  );

  const wrongCity = runDeterministicChecks({
    site,
    business: { ...business, address: "Glavni trg 1, 2000 Maribor, Slovenia" },
    lead: lead
      ? { ...lead, address: "Glavni trg 1, 2000 Maribor, Slovenia" }
      : null,
  });
  ok(
    "wrong city is a mismatch",
    wrongCity.identityDiffs.some(
      (diff) => diff.field === "city" && diff.kind === "mismatch",
    ),
  );

  const wrongName = runDeterministicChecks({
    site,
    business: { ...business, companyName: "Frizerski salon Nova" },
    lead: lead ? { ...lead, companyName: "Frizerski salon Nova" } : null,
  });
  ok(
    "wrong business name is a mismatch",
    wrongName.identityDiffs.some(
      (diff) => diff.field === "companyName" && diff.kind === "mismatch",
    ),
  );

  const claims = runDeterministicChecks({
    site: {
      ...site,
      hero: { ...site.hero, badge: "Nagrajena kavarna z 500+ zadovoljnimi strankami" },
    },
    business: { ...business, yearsExperience: "", sellingPoints: [] },
    lead,
  });
  ok(
    "unsupported claim is detected",
    claims.unsupportedClaims.length > 0,
  );

  const unknownIssues = deterministicIssuesFromChecks(baseline);
  ok(
    "unknown information does not become an issue",
    !unknownIssues.some((item) => item.field === "phone" || item.field === "openingHours"),
  );
}

function testIdempotency(): void {
  console.log("== idempotency ==");

  ok(
    "same hash automatic skip",
    shouldSkipAutomaticQa({
      completedHash: "abc",
      contentHash: "abc",
      force: false,
    }),
  );
  ok(
    "admin force does not skip",
    !shouldSkipAutomaticQa({
      completedHash: "abc",
      contentHash: "abc",
      force: true,
    }),
  );
  ok(
    "new hash does not skip",
    !shouldSkipAutomaticQa({
      completedHash: "abc",
      contentHash: "def",
      force: false,
    }),
  );
}

function testApiFailure(): void {
  console.log("== API failure ==");

  ok("timeout is retryable", isQaRetryable(new QaRetryableError("timeout")));
  ok("500 is retryable", isQaRetryable({ status: 500, message: "boom" }));
  ok(
    "invalid JSON is retryable",
    isQaRetryable(new Error("Grok returned invalid JSON")),
  );
  ok("schema failure is retryable", isQaRetryable(new ZodError([])));
  ok("401 is not retryable", !isQaRetryable({ status: 401, message: "nope" }));
  ok(
    "missing key is not retryable",
    !isQaRetryable(new QaFatalError("XAI_API_KEY is not configured")),
  );
}

async function testAgentAndSecurity(): Promise<void> {
  console.log("== agent / security ==");

  const { site, business } = loadGeneratedSite("kavarna-trnovo");
  const lead = readLead("kavarna-trnovo");
  const deterministicChecks = runDeterministicChecks({ site, business, lead });

  const client: GrokStructuredClient = {
    async complete() {
      return {
        text: JSON.stringify({
          summary: "Copy is mostly fine.",
          issues: [
            {
              severity: "low",
              category: "ux",
              type: "ux_cta",
              field: "hero.primaryCta",
              message: "CTA could be more specific",
              evidence: site.hero.primaryCta,
              expected: "Visit or call CTA",
              actual: site.hero.primaryCta,
              confidence: 0.7,
              verificationStatus: "verified",
              autoFixable: false,
              recommendedFix: "Use a local-business CTA",
            },
          ],
        }),
        usage: {
          model: "grok-4.6",
          inputTokens: 100,
          outputTokens: 50,
          estimatedCostUsd: 0.0005,
        },
      };
    },
  };

  const { result } = await runQaAgent(
    {
      lead: {
        slug: "kavarna-trnovo",
        companyName: "Kavarna Trnovo",
        industry: "bar",
        phone: null,
        address: lead?.address ?? null,
        city: "Ljubljana",
        status: "generated",
      },
      business,
      siteCopy: {
        brand: `${site.brand.prefix} ${site.brand.highlight}`,
        metadataTitle: site.metadata.title,
        metadataDescription: site.metadata.description,
        heroTitle: site.hero.title,
        heroHighlight: site.hero.titleHighlight,
        heroDescription: site.hero.description,
        primaryCta: site.hero.primaryCta,
        secondaryCta: site.hero.secondaryCta,
        services: site.services.items.map((item) => ({
          title: item.title,
          description: item.description,
        })),
        contactItems: site.contact.items.map((item) => ({
          label: item.label,
          value: item.value,
        })),
        pricing: null,
        footerAddress: site.footer.address,
        visibleCopy: [],
      },
      deterministicChecks,
      deployment: { path: "/kavarna-trnovo", liveUrlKnown: false },
    },
    client,
  );

  ok("fixture demo QA returns a structured result", Boolean(result.summary));
  ok("fixture demo QA has a policy status", Boolean(result.policyStatus));
  ok(
    "recommendedFix is data not an executor",
    result.issues.every((item) => typeof item.recommendedFix === "string"),
  );

  const visual = mergeQaIssues(
    [],
    [
      issue({
        message: "The button is too low contrast",
        verificationStatus: "verified",
      }),
    ],
  );
  ok(
    "visual claims without evidence become not_verified",
    visual[0]?.verificationStatus === "not_verified",
  );

  const failingClient: GrokStructuredClient = {
    async complete() {
      return {
        text: "rm -rf / && DROP TABLE qa_runs;",
        usage: {
          model: "grok-4.6",
          inputTokens: 1,
          outputTokens: 1,
          estimatedCostUsd: 0,
        },
      };
    },
  };

  let rejectedShell = false;
  try {
    await runQaAgent(
      {
        lead: {
          slug: "kavarna-trnovo",
          companyName: "Kavarna Trnovo",
          industry: "bar",
          phone: null,
          address: null,
          city: null,
          status: "generated",
        },
        business,
        siteCopy: {
          brand: "Kavarna Trnovo",
          metadataTitle: site.metadata.title,
          metadataDescription: site.metadata.description,
          heroTitle: site.hero.title,
          heroHighlight: site.hero.titleHighlight,
          heroDescription: site.hero.description,
          primaryCta: site.hero.primaryCta,
          secondaryCta: site.hero.secondaryCta,
          services: [],
          contactItems: [],
          pricing: null,
          footerAddress: site.footer.address,
          visibleCopy: [],
        },
        deterministicChecks,
        deployment: { path: "/kavarna-trnovo", liveUrlKnown: false },
      },
      failingClient,
    );
  } catch {
    rejectedShell = true;
  }
  ok("model output cannot execute commands or SQL", rejectedShell);
}

async function main(): Promise<void> {
  testSchema();
  testPolicy();
  testDeterministic();
  testIdempotency();
  testApiFailure();
  await testAgentAndSecurity();

  if (failures > 0) {
    console.error(`\n${failures} failing checks`);
    process.exit(1);
  }

  console.log("\nAll Grok QA checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
