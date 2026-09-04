import assert from "node:assert/strict";
import {
  collectQueueItems,
  countQueueKinds,
  getActionQueue,
  getQueueCounts,
  getQueueNeighbors,
  type QueueItemCore,
} from "../src/admin/queue";
import { getOnboardingDesiredDomain } from "../src/onboarding/desired-domain";
import {
  canAdminAttachWebsiteDomain,
  isOnboardingLockedForCustomerEdits,
  ONBOARDING_WEBSITE_DOMAIN_ADMIN_STATUSES,
} from "../src/onboarding/types";
import {
  deriveWebsiteDomainAttentionState,
  sortWebsiteDomainAdminRows,
} from "../src/website-domains/admin-queue";

function ok(label: string, condition: boolean): void {
  assert.ok(condition, label);
  console.log(`  ✓ ${label}`);
}

function testDesiredDomain(): void {
  console.log("\ngetOnboardingDesiredDomain");

  ok(
    "answers win over payload",
    getOnboardingDesiredDomain({
      answers: { desiredDomain: " answers.si " },
      processedPayload: {
        slug: "x",
        mergedAt: "",
        businessInput: {},
        siteHints: {
          desiredDomain: "payload.si",
          hasExistingDomain: false,
          demoChanges: null,
          colorPreferences: null,
          logoUrls: [],
          photoUrls: [],
          uploadedImages: [],
          additionalNotes: null,
        },
      },
    }) === "answers.si",
  );

  ok(
    "falls back to payload",
    getOnboardingDesiredDomain({
      answers: {},
      processedPayload: {
        slug: "x",
        mergedAt: "",
        businessInput: {},
        siteHints: {
          desiredDomain: "payload.si",
          hasExistingDomain: false,
          demoChanges: null,
          colorPreferences: null,
          logoUrls: [],
          photoUrls: [],
          uploadedImages: [],
          additionalNotes: null,
        },
      },
    }) === "payload.si",
  );

  ok(
    "empty answers desiredDomain skips to payload",
    getOnboardingDesiredDomain({
      answers: { desiredDomain: "   " },
      processedPayload: {
        slug: "x",
        mergedAt: "",
        businessInput: {},
        siteHints: {
          desiredDomain: "payload.si",
          hasExistingDomain: false,
          demoChanges: null,
          colorPreferences: null,
          logoUrls: [],
          photoUrls: [],
          uploadedImages: [],
          additionalNotes: null,
        },
      },
    }) === "payload.si",
  );

  ok("null when missing", getOnboardingDesiredDomain(null) === null);
}

function testEligibilityGate(): void {
  console.log("\nWebsite domain eligibility gate");

  for (const status of ONBOARDING_WEBSITE_DOMAIN_ADMIN_STATUSES) {
    ok(
      `${status} is eligible`,
      canAdminAttachWebsiteDomain(status) &&
        isOnboardingLockedForCustomerEdits(status),
    );
  }

  ok(
    "ready_for_approval is not eligible",
    !canAdminAttachWebsiteDomain("ready_for_approval"),
  );
}

function testAttentionState(): void {
  console.log("\nderiveWebsiteDomainAttentionState");

  ok(
    "publish_failed onboarding → failed",
    deriveWebsiteDomainAttentionState({
      onboardingStatus: "publish_failed",
      domains: [],
    }) === "failed",
  );

  ok(
    "failed domain → failed",
    deriveWebsiteDomainAttentionState({
      onboardingStatus: "live",
      domains: [
        {
          id: 1,
          customerSlug: "x",
          hostname: "a.si",
          kind: "apex",
          status: "failed",
          canonical: true,
          vercelVerified: false,
          vercelError: "err",
          createdAt: "",
          updatedAt: "",
        },
      ],
    }) === "failed",
  );

  ok(
    "not attached → pending",
    deriveWebsiteDomainAttentionState({
      onboardingStatus: "approved_for_publish",
      domains: [],
    }) === "pending",
  );

  ok(
    "live domains → live",
    deriveWebsiteDomainAttentionState({
      onboardingStatus: "live",
      domains: [
        {
          id: 1,
          customerSlug: "x",
          hostname: "a.si",
          kind: "apex",
          status: "live",
          canonical: true,
          vercelVerified: true,
          vercelError: null,
          createdAt: "",
          updatedAt: "2026-01-02",
        },
      ],
    }) === "live",
  );

  const sorted = sortWebsiteDomainAdminRows([
    {
      slug: "live-co",
      companyName: "Live",
      onboardingStatus: "live",
      desiredDomain: null,
      domains: [],
      attentionState: "live",
      sortUpdatedAt: "2026-01-01",
    },
    {
      slug: "fail-co",
      companyName: "Fail",
      onboardingStatus: "publish_failed",
      desiredDomain: null,
      domains: [],
      attentionState: "failed",
      sortUpdatedAt: "2026-01-03",
    },
    {
      slug: "pend-co",
      companyName: "Pending",
      onboardingStatus: "approved_for_publish",
      desiredDomain: "p.si",
      domains: [],
      attentionState: "pending",
      sortUpdatedAt: "2026-01-04",
    },
  ]);

  ok(
    "sort failed before pending before live",
    sorted.map((row) => row.slug).join(",") === "fail-co,pend-co,live-co",
  );
}

function testQueueSort(): void {
  console.log("\nQueue sort + count helpers");

  const items: QueueItemCore[] = [
    {
      slug: "a",
      companyName: "A",
      kind: "onboarding_review",
      score: 800,
      subtitle: "",
      updatedAt: "2026-01-01",
      href: "/admin/e/a",
    },
    {
      slug: "b",
      companyName: "B",
      kind: "publish_failed",
      score: 1000,
      subtitle: "",
      updatedAt: "2026-01-02",
      href: "/admin/e/b",
    },
  ];

  const counts = countQueueKinds(items);
  ok("counts publish_failed", counts.publish_failed === 1);
  ok("counts onboarding_review", counts.onboarding_review === 1);
}

async function testQueueParityWithDb(): Promise<void> {
  console.log("\nQueue parity (requires DATABASE_URL)");

  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.log("  (skipped — no DATABASE_URL)");
    return;
  }

  const [counts, actionQueue, collected] = await Promise.all([
    getQueueCounts(),
    getActionQueue(200),
    collectQueueItems(200),
  ]);

  const countsFromActions = countQueueKinds(actionQueue);
  const countsFromCollect = countQueueKinds(collected);

  ok(
    "getQueueCounts matches collectQueueItems kinds",
    JSON.stringify(counts) === JSON.stringify(countsFromCollect),
  );

  ok(
    "getActionQueue kinds match collectQueueItems",
    JSON.stringify(countsFromActions) === JSON.stringify(countsFromCollect),
  );

  ok(
    "getActionQueue slug order matches collectQueueItems",
    actionQueue.map((item) => item.slug).join(",") ===
      collected.map((item) => item.slug).join(","),
  );

  if (collected.length > 0) {
    const mid = collected[Math.floor(collected.length / 2)]!.slug;
    const neighbors = await getQueueNeighbors(mid);
    const index = collected.findIndex((item) => item.slug === mid);
    ok("neighbor index matches collect", neighbors.index === index);
    ok(
      "neighbor prev matches collect",
      neighbors.prev === (index > 0 ? collected[index - 1]!.slug : null),
    );
    ok(
      "neighbor next matches collect",
      neighbors.next ===
        (index < collected.length - 1 ? collected[index + 1]!.slug : null),
    );
  }
}

async function main(): Promise<void> {
  console.log("Admin queue + domains tests");
  testDesiredDomain();
  testEligibilityGate();
  testAttentionState();
  testQueueSort();
  await testQueueParityWithDb();
  console.log("\nAll admin queue + domains tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
