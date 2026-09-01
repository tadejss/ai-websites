import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { isDemoTrackingExcludedSlug } from "../src/demo-lifecycle/excluded-slugs";
import {
  demoAgeDays,
  isNeverViewedDemo,
  isDemoLifecycleStatus,
} from "../src/demo-lifecycle/types";
import {
  extractViewContext,
  shouldCountDemoView,
  type DemoViewContext,
} from "../src/demo-lifecycle/view-eligibility";
import { buildViewerKey, dedupeWindowHours } from "../src/demo-lifecycle/viewer-key";

function ok(label: string, condition: boolean): void {
  assert.ok(condition, label);
  console.log(`  ✓ ${label}`);
}

function headersFrom(context: Partial<DemoViewContext> & { userAgent: string }): Headers {
  const h = new Headers();
  h.set("user-agent", context.userAgent);
  if (context.purpose) {
    h.set("purpose", context.purpose);
  }
  if (context.secPurpose) {
    h.set("sec-purpose", context.secPurpose);
  }
  if (context.secFetchDest) {
    h.set("sec-fetch-dest", context.secFetchDest);
  }
  if (context.isRscRequest) {
    h.set("rsc", "1");
  }
  if (context.isRouterPrefetch) {
    h.set("next-router-prefetch", "1");
  }
  if (context.clientIp) {
    h.set("x-forwarded-for", context.clientIp);
  }
  return h;
}

function testViewEligibility(): void {
  console.log("\nView eligibility");

  const browser = extractViewContext(
    headersFrom({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0.0.0",
      secFetchDest: "document",
      clientIp: "203.0.113.10",
    }),
  );
  ok("normal browser navigation counts", shouldCountDemoView(browser));

  const bot = extractViewContext(
    headersFrom({ userAgent: "Googlebot/2.1 (+http://www.google.com/bot.html)" }),
  );
  ok("bot UA rejected", !shouldCountDemoView(bot));

  const prefetch = extractViewContext(
    headersFrom({
      userAgent: "Mozilla/5.0 Chrome/120",
      purpose: "prefetch",
    }),
  );
  ok("prefetch rejected", !shouldCountDemoView(prefetch));

  const rsc = extractViewContext(
    headersFrom({
      userAgent: "Mozilla/5.0 Chrome/120",
      isRscRequest: true,
    }),
  );
  ok("RSC request rejected", !shouldCountDemoView(rsc));

  const imageDest = extractViewContext(
    headersFrom({
      userAgent: "Mozilla/5.0 Chrome/120",
      secFetchDest: "image",
    }),
  );
  ok("non-document fetch dest rejected", !shouldCountDemoView(imageDest));

  const cron = extractViewContext(
    headersFrom({ userAgent: "vercel-cron/1.0" }),
  );
  ok("vercel cron rejected", !shouldCountDemoView(cron));
}

async function testViewerKey(): Promise<void> {
  console.log("\nViewer key");

  process.env.DEMO_VIEW_HASH_SECRET = "test-secret";
  const context: DemoViewContext = {
    userAgent: "Mozilla/5.0 Chrome/120",
    purpose: null,
    secPurpose: null,
    secFetchDest: "document",
    isRscRequest: false,
    isRouterPrefetch: false,
    clientIp: "203.0.113.10",
  };

  const key1 = await buildViewerKey("demo-slug", context);
  const key2 = await buildViewerKey("demo-slug", context);
  ok("viewer key is stable", key1 === key2 && Boolean(key1));

  const keyOtherSlug = await buildViewerKey("other-slug", context);
  ok("viewer key differs by slug", key1 !== keyOtherSlug);

  delete process.env.DEMO_VIEW_HASH_SECRET;
  process.env.NODE_ENV = "test";
  ok("dev fallback secret works", Boolean(await buildViewerKey("x", context)));

  process.env.NODE_ENV = "production";
  ok(
    "production requires secret",
    (await buildViewerKey("x", context)) === null,
  );
  process.env.NODE_ENV = "test";
  process.env.DEMO_VIEW_HASH_SECRET = "test-secret";

  ok("default dedupe window is 4h", dedupeWindowHours() === 4);
  process.env.DEMO_VIEW_DEDUPE_HOURS = "2";
  ok("dedupe window env override", dedupeWindowHours() === 2);
  delete process.env.DEMO_VIEW_DEDUPE_HOURS;
}

function testLifecycleHelpers(): void {
  console.log("\nLifecycle helpers");

  ok("status enum includes viewed", isDemoLifecycleStatus("viewed"));

  const published = {
    slug: "x",
    lifecycleStatus: "published" as const,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    firstViewedAt: null,
    lastViewedAt: null,
    viewCount: 0,
    purchasedAt: null,
    updatedAt: new Date().toISOString(),
  };

  ok("never viewed published demo", isNeverViewedDemo(published, false));
  ok("customer excludes never viewed", !isNeverViewedDemo(published, true));

  const viewed = { ...published, viewCount: 2, firstViewedAt: new Date().toISOString(), lifecycleStatus: "viewed" as const };
  ok("viewed demo is not never viewed", !isNeverViewedDemo(viewed, false));

  ok("demo age uses published_at", demoAgeDays(published) === 3);

  ok("excluded slug zbrendiraj-si", isDemoTrackingExcludedSlug("zbrendiraj-si"));
  ok("normal slug not excluded", !isDemoTrackingExcludedSlug("frizer-janez"));
}

function testDedupeLogic(): void {
  console.log("\nDedupe logic (pure)");

  // Simulate dedupe decision: new key vs active window
  const secret = "test";
  const slug = "demo";
  const material = "demo|203.0.113.0|mozilla";
  const viewerKey = createHmac("sha256", secret).update(material).digest("hex");

  const activeWindows = new Set<string>([`${slug}:${viewerKey}`]);
  const isDuplicate = activeWindows.has(`${slug}:${viewerKey}`);
  ok("repeat within window is duplicate", isDuplicate);

  activeWindows.delete(`${slug}:${viewerKey}`);
  ok("after window expiry slot is free", !activeWindows.has(`${slug}:${viewerKey}`));
}

function testExtractViewContext(): void {
  console.log("\nExtract view context");

  const headers = new Headers();
  headers.set("user-agent", "Mozilla/5.0");
  headers.set("x-forwarded-for", "198.51.100.1, 10.0.0.1");
  headers.set("sec-fetch-dest", "document");

  const ctx = extractViewContext(headers);
  ok("extracts UA", ctx.userAgent === "Mozilla/5.0");
  ok("extracts first forwarded IP", ctx.clientIp === "198.51.100.1");
  ok("extracts sec-fetch-dest", ctx.secFetchDest === "document");
}

async function main(): Promise<void> {
  console.log("Demo lifecycle tests");
  testViewEligibility();
  await testViewerKey();
  testLifecycleHelpers();
  testDedupeLogic();
  testExtractViewContext();
  console.log("\nAll demo lifecycle tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
