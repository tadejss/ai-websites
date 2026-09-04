import assert from "node:assert/strict";
import { shouldSkipVercelReconcile } from "../src/website-domains/attach";
import {
  isBlockedWebsiteApex,
  parseWebsiteHostPair,
} from "../src/website-domains/hostname";
import {
  customerHostRewritePath,
  shouldSkipCustomerHostRewrite,
} from "../src/website-domains/rewrite";
import { WebsiteDomainValidationError } from "../src/website-domains/types";

function ok(label: string, condition: boolean): void {
  assert.ok(condition, label);
  console.log(`  ✓ ${label}`);
}

function throws(label: string, fn: () => void): void {
  try {
    fn();
    assert.fail(label);
  } catch (error) {
    ok(label, error instanceof WebsiteDomainValidationError);
  }
}

function testHostPair(): void {
  console.log("\nHostname pair");

  const fromApex = parseWebsiteHostPair("https://Example.si/path");
  ok("apex input yields apex", fromApex.apex === "example.si");
  ok("apex input yields www", fromApex.www === "www.example.si");

  const fromWww = parseWebsiteHostPair("WWW.example.si");
  ok("www input yields same apex", fromWww.apex === "example.si");
  ok("www input yields www", fromWww.www === "www.example.si");

  throws("rejects zbrendiraj.si", () => parseWebsiteHostPair("zbrendiraj.si"));
  throws("rejects www.zbrendiraj.si", () =>
    parseWebsiteHostPair("www.zbrendiraj.si"),
  );
  throws("rejects splet.vercel.app", () =>
    parseWebsiteHostPair("splet.vercel.app"),
  );
  throws("rejects *.vercel.app", () =>
    parseWebsiteHostPair("foo.vercel.app"),
  );
  throws("rejects localhost", () => parseWebsiteHostPair("localhost"));
  throws("rejects IP", () => parseWebsiteHostPair("127.0.0.1"));
  throws("rejects malformed", () => parseWebsiteHostPair("not a domain"));

  ok("platform apex blocked", isBlockedWebsiteApex("zbrendiraj.si"));
  ok("customer apex allowed", !isBlockedWebsiteApex("primer.si"));
}

function testRewrite(): void {
  console.log("\nCustomer host rewrite");

  ok("root rewrites to slug", customerHostRewritePath("/", "salon") === "/salon");
  ok(
    "nested path keeps suffix",
    customerHostRewritePath("/storitve", "salon") === "/salon/storitve",
  );
  ok(
    "nested path with extra segment",
    customerHostRewritePath("/a/b", "salon") === "/salon/a/b",
  );

  ok("skips /api", shouldSkipCustomerHostRewrite("/api/admin/x"));
  ok("skips /admin", shouldSkipCustomerHostRewrite("/admin/e/slug"));
  ok("skips /_next", shouldSkipCustomerHostRewrite("/_next/static/x.js"));
  ok("skips robots.txt", shouldSkipCustomerHostRewrite("/robots.txt"));
  ok("skips sitemap.xml", shouldSkipCustomerHostRewrite("/sitemap.xml"));
  ok(
    "does not skip site path",
    !shouldSkipCustomerHostRewrite("/storitve"),
  );

  const url = new URL("https://example.si/storitve?x=1");
  url.pathname = customerHostRewritePath(url.pathname, "salon");
  ok("rewrite keeps query string", url.pathname === "/salon/storitve" && url.search === "?x=1");
}

function testReconcileSkip(): void {
  console.log("\nVercel reconcile skip");

  ok(
    "skips live verified host on retry",
    shouldSkipVercelReconcile({ status: "live", vercelVerified: true }),
  );
  ok(
    "does not skip pending",
    !shouldSkipVercelReconcile({ status: "pending", vercelVerified: false }),
  );
  ok(
    "does not skip failed",
    !shouldSkipVercelReconcile({ status: "failed", vercelVerified: false }),
  );
  ok("does not skip missing row", !shouldSkipVercelReconcile(undefined));
}

function main(): void {
  console.log("Website domain tests");
  testHostPair();
  testRewrite();
  testReconcileSkip();
  console.log("\nAll website domain tests passed.");
}

main();
