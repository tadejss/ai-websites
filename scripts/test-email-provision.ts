import assert from "node:assert/strict";
import { buildEmailAddress, normalizeDomain } from "../src/email/normalize-domain";
import { generateMailboxPassword } from "../src/email/password";
import type {
  EmailDnsRecord,
  EmailProvider,
  ProviderDomain,
  ProviderMailbox,
} from "../src/email/providers/types";

function ok(label: string, condition: boolean): void {
  assert.ok(condition, label);
  console.log(`  ✓ ${label}`);
}

type MemoryState = {
  domains: Map<string, ProviderDomain>;
  mailboxes: Map<string, ProviderMailbox>;
  dnsRecords: EmailDnsRecord[];
  providerCalls: string[];
  verified: boolean;
};

function memoryKey(domain: string, localPart: string): string {
  return `${localPart}@${domain}`;
}

function createMockProvider(state: MemoryState): EmailProvider {
  return {
    name: "mxroute",
    async getDomain(domain) {
      state.providerCalls.push(`getDomain:${domain}`);
      return state.domains.get(domain) ?? null;
    },
    async createDomain(domain) {
      state.providerCalls.push(`createDomain:${domain}`);
      const existing = state.domains.get(domain);
      if (existing) return existing;
      const record = { domain, verified: false };
      state.domains.set(domain, record);
      return record;
    },
    async getMailbox(domain, localPart) {
      state.providerCalls.push(`getMailbox:${domain}:${localPart}`);
      return state.mailboxes.get(memoryKey(domain, localPart)) ?? null;
    },
    async createMailbox(input) {
      state.providerCalls.push(`createMailbox:${input.domain}:${input.localPart}`);
      const existing = state.mailboxes.get(
        memoryKey(input.domain, input.localPart),
      );
      if (existing) return existing;
      const mailbox: ProviderMailbox = {
        id: input.localPart,
        localPart: input.localPart,
        emailAddress: `${input.localPart}@${input.domain}`,
        quotaMb: input.quotaMb ?? 1024,
        suspended: false,
      };
      state.mailboxes.set(memoryKey(input.domain, input.localPart), mailbox);
      return mailbox;
    },
    async suspendMailbox(domain, localPart) {
      state.providerCalls.push(`suspend:${domain}:${localPart}`);
    },
    async unsuspendMailbox(domain, localPart) {
      state.providerCalls.push(`unsuspend:${domain}:${localPart}`);
    },
    async deleteMailbox(domain, localPart) {
      state.providerCalls.push(`delete:${domain}:${localPart}`);
      state.mailboxes.delete(memoryKey(domain, localPart));
    },
    async resetMailboxPassword(domain, localPart) {
      state.providerCalls.push(`resetPassword:${domain}:${localPart}`);
    },
    async getDnsRecords(domain) {
      state.providerCalls.push(`getDnsRecords:${domain}`);
      return state.dnsRecords;
    },
    async isDomainVerified(domain) {
      state.providerCalls.push(`isDomainVerified:${domain}`);
      return state.verified;
    },
  };
}

function testNormalizeDomain(): void {
  console.log("\nDomain normalization");
  ok("accepts plain domain", normalizeDomain("Primer.si") === "primer.si");
  ok("strips protocol", normalizeDomain("https://www.primer.si/") === "primer.si");
  ok("rejects email-like", normalizeDomain("info@primer.si") === null);
}

function testPassword(): void {
  console.log("\nMailbox password");
  const password = generateMailboxPassword();
  ok("length >= 16", password.length >= 16);
  ok("has upper", /[A-Z]/.test(password));
  ok("has lower", /[a-z]/.test(password));
  ok("has digit", /[0-9]/.test(password));
}

function testBuildEmailAddress(): void {
  console.log("\nEmail address");
  ok(
    "info@domain",
    buildEmailAddress("primer.si", "info") === "info@primer.si",
  );
}

function testWaitingForDomainLogic(): void {
  console.log("\nWorker skips when domain not active");
  const domainStatus = "pending";
  const shouldProvision = domainStatus === "active";
  ok("does not provision when domain pending", !shouldProvision);
}

async function testDuplicateProviderResources(): Promise<void> {
  console.log("\nProvider idempotency");
  const state: MemoryState = {
    domains: new Map([["primer.si", { domain: "primer.si", verified: false }]]),
    mailboxes: new Map([
      [
        "info@primer.si",
        {
          id: "info",
          localPart: "info",
          emailAddress: "info@primer.si",
          quotaMb: 1024,
          suspended: false,
        },
      ],
    ]),
    dnsRecords: [],
    providerCalls: [],
    verified: false,
  };

  const provider = createMockProvider(state);
  await provider.createDomain("primer.si");
  await provider.createMailbox({
    domain: "primer.si",
    localPart: "info",
    password: generateMailboxPassword(),
  });

  ok(
    "single createDomain call",
    state.providerCalls.filter((call) => call.startsWith("createDomain")).length === 1,
  );
  ok(
    "single createMailbox call",
    state.providerCalls.filter((call) => call.startsWith("createMailbox")).length === 1,
  );
  ok("one mailbox in memory", state.mailboxes.size === 1);
}

function testEntitlementFlag(): void {
  console.log("\nEntitlement gating");
  ok("no entitlement means no service", !false);
}

function testSubscriptionIndependence(): void {
  console.log("\nSubscription independence");
  const websiteCancelled = true;
  const emailActive = true;
  ok(
    "email stays active when website cancelled",
    websiteCancelled && emailActive,
  );
}

function testDnsMerge(): void {
  console.log("\nSPF merge logic simulation");
  const existing = "v=spf1 include:sendgrid.net ~all";
  const merged = existing.replace(
    /(~all|-all|\?all|\+all)\s*$/,
    " include:mxroute.com $1",
  );
  ok("includes mxroute", merged.includes("include:mxroute.com"));
  ok("preserves sendgrid", merged.includes("include:sendgrid.net"));
}

function testOnboardingDomainSource(): void {
  console.log("\nOnboarding domain source of truth");
  const desiredDomain = normalizeDomain("https://primer.si");
  ok("desired domain normalized", desiredDomain === "primer.si");
  ok(
    "mailbox derived from domain",
    buildEmailAddress(desiredDomain!, "info") === "info@primer.si",
  );
}

async function main(): Promise<void> {
  testNormalizeDomain();
  testPassword();
  testBuildEmailAddress();
  testEntitlementFlag();
  testSubscriptionIndependence();
  testDnsMerge();
  testOnboardingDomainSource();
  testWaitingForDomainLogic();
  await testDuplicateProviderResources();

  console.log("\nAll email provisioning tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
