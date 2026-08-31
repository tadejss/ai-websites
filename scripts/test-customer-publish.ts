import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  canAdminApproveOnboarding,
  canRetryCustomerPublish,
  isOnboardingLockedForCustomerEdits,
  isOnboardingStatus,
  ONBOARDING_STATUSES,
} from "../src/onboarding/types";
import { buildProcessedPayload } from "../src/onboarding/process";
import { mergeSiteConfigWithOnboarding, applyCustomerSite } from "../src/onboarding/apply-customer-site";
import { validateSiteConfig } from "../src/content/validate-site-config";

function ok(label: string, condition: boolean): void {
  assert.ok(condition, label);
  console.log(`  ✓ ${label}`);
}

function testOnboardingStatuses(): void {
  console.log("\nOnboarding status helpers");

  ok("includes publishing", isOnboardingStatus("publishing"));
  ok("includes publish_failed", isOnboardingStatus("publish_failed"));
  ok(
    "all statuses registered",
    ONBOARDING_STATUSES.includes("publishing") &&
      ONBOARDING_STATUSES.includes("publish_failed"),
  );

  ok(
    "customer can edit while ready_for_approval",
    !isOnboardingLockedForCustomerEdits("ready_for_approval"),
  );
  ok(
    "customer locked after approve",
    isOnboardingLockedForCustomerEdits("approved_for_publish"),
  );
  ok(
    "customer locked when live",
    isOnboardingLockedForCustomerEdits("live"),
  );

  ok(
    "admin can approve ready_for_approval",
    canAdminApproveOnboarding("ready_for_approval"),
  );
  ok(
    "admin cannot approve publishing",
    !canAdminApproveOnboarding("publishing"),
  );

  ok(
    "retry allowed on publish_failed",
    canRetryCustomerPublish("publish_failed"),
  );
  ok(
    "retry allowed on approved_for_publish",
    canRetryCustomerPublish("approved_for_publish"),
  );
  ok("retry blocked on live", !canRetryCustomerPublish("live"));
}

function minimalSiteConfig() {
  return validateSiteConfig({
    appearance: "beauty",
    brand: { prefix: "Demo", highlight: "Salon" },
    metadata: { title: "Demo", description: "Demo desc" },
    nav: { links: [], cta: "Kontakt" },
    hero: {
      badge: "Badge",
      title: "Title",
      titleHighlight: "Highlight",
      description: "Desc",
      primaryCta: "Call",
      secondaryCta: "More",
      stats: [],
    },
    services: {
      id: "storitve",
      eyebrow: "Storitve",
      title: "Storitve",
      description: "Desc",
      items: [{ title: "S1", description: "D1", icon: "service-1" }],
    },
    whyChooseUs: {
      id: "zakaj",
      eyebrow: "Zakaj",
      title: "Zakaj",
      description: "Desc",
      highlights: ["H1"],
      benefits: [],
    },
    contact: {
      id: "kontakt",
      eyebrow: "Kontakt",
      title: "Kontakt",
      description: "Desc",
      items: [{ label: "Tel", value: "000", icon: "phone" }],
      form: {
        title: "Form",
        description: "Desc",
        nameLabel: "Ime",
        namePlaceholder: "Ime",
        phoneLabel: "Tel",
        phonePlaceholder: "Tel",
        messageLabel: "Msg",
        messagePlaceholder: "Msg",
        submitLabel: "Pošlji",
      },
    },
    footer: { address: "Addr", rights: "Rights" },
  });
}

function testApplyCustomerSiteMerge(): void {
  console.log("\nApply customer site merge");

  const siteConfig = minimalSiteConfig();

  const payload = buildProcessedPayload("test-slug", {
    companyName: "Nova Firma d.o.o.",
    email: "info@nova.si",
    phone: "041 123 456",
    address: "Nova ulica 1, Ljubljana",
    businessDescription: "Nov opis",
    services: ["Striženje", "Barvanje"],
    sellingPoints: ["Hitro", "Kakovostno"],
    desiredDomain: "nova.si",
    hasExistingDomain: false,
  });

  const merged = mergeSiteConfigWithOnboarding(
    siteConfig,
    payload.businessInput as never,
    payload.siteHints,
  );

  ok("updates company metadata", merged.metadata.title === "Nova Firma d.o.o.");
  ok("updates services count", merged.services.items.length === 2);
  ok(
    "updates phone contact",
    merged.contact.items.some((item) => item.icon === "phone" && item.value.includes("041")),
  );
  ok("updates footer address", merged.footer.address.includes("Nova ulica"));
  ok(
    "updates highlights",
    merged.whyChooseUs.highlights.includes("Hitro"),
  );
}

function testDemoSnapshot(): void {
  console.log("\nDemo snapshot on apply");

  const root = mkdtempSync(join(tmpdir(), "customer-publish-"));
  const prevCwd = process.cwd();
  process.chdir(root);

  try {
    mkdirSync(resolve("src/content/clients/test-slug"), { recursive: true });
    writeFileSync(
      resolve("src/content/clients/test-slug/site.json"),
      `${JSON.stringify(minimalSiteConfig(), null, 2)}\n`,
    );
    writeFileSync(
      resolve("src/content/clients/test-slug/business.json"),
      `${JSON.stringify({ companyName: "Original" }, null, 2)}\n`,
    );

    const payload = buildProcessedPayload("test-slug", {
      companyName: "Updated Co",
      email: "a@b.si",
      phone: "041",
      businessDescription: "Desc",
      services: ["One"],
      desiredDomain: "x.si",
    });

    applyCustomerSite("test-slug", payload);

    ok(
      "demo snapshot created",
      readFileSync(resolve("src/content/clients/test-slug/demo/site.json"), "utf8").includes(
        '"prefix": "Demo"',
      ),
    );
    ok(
      "live site updated",
      readFileSync(resolve("src/content/clients/test-slug/site.json"), "utf8").includes(
        "Updated Co",
      ),
    );
  } finally {
    process.chdir(prevCwd);
  }
}

function testPublishStateTransitions(): void {
  console.log("\nPublish state transitions (logic)");

  ok(
    "approved_for_publish is retryable",
    canRetryCustomerPublish("approved_for_publish"),
  );
  ok(
    "publish_failed is retryable",
    canRetryCustomerPublish("publish_failed"),
  );
  ok(
    "publishing is retryable when stuck",
    canRetryCustomerPublish("publishing"),
  );
  ok("live is not retryable", !canRetryCustomerPublish("live"));
  ok(
    "ready_for_approval is not retryable",
    !canRetryCustomerPublish("ready_for_approval"),
  );
}

async function main(): Promise<void> {
  console.log("Customer publish tests");
  testOnboardingStatuses();
  testApplyCustomerSiteMerge();
  testDemoSnapshot();
  testPublishStateTransitions();
  console.log("\nAll customer publish tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
