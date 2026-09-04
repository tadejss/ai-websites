import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalizeSlovenianPhone, isSlovenianMobilePhone } from "../src/outreach/sms/phone";
import { analyzeSmsLength, renderSms } from "../src/outreach/sms/templates";
import { evaluateSmsEligibility } from "../src/outreach/sms/eligibility";
import { isOptOutMessage, parseSmsOptOut, canCancelOnOptOut } from "../src/outreach/sms/opt-out";
import { isRelevantSmsLead } from "../src/outreach/sms/relevance";
import { clientSiteExists } from "../src/leads/client-exists";
import type { LeadRecord } from "../src/leads/store";

function ok(condition: boolean, message: string) {
  assert.equal(condition, true, message);
}

async function main() {
  ok(normalizeSlovenianPhone("041 123 456").ok === true, "spaced mobile");
  ok(
    (normalizeSlovenianPhone("041 123 456") as { e164: string }).e164 ===
      "+38641123456",
    "041 → +38641",
  );
  ok(
    (normalizeSlovenianPhone("041123456") as { e164: string }).e164 ===
      "+38641123456",
    "compact",
  );
  ok(
    (normalizeSlovenianPhone("+386 41 123 456") as { e164: string }).e164 ===
      "+38641123456",
    "plus",
  );
  ok(
    (normalizeSlovenianPhone("0038641123456") as { e164: string }).e164 ===
      "+38641123456",
    "00 prefix",
  );
  ok(normalizeSlovenianPhone("123").ok === false, "invalid short");
  ok(normalizeSlovenianPhone("").ok === false, "empty invalid");

  ok(isSlovenianMobilePhone("041 696 401") === true, "mobile 041");
  ok(isSlovenianMobilePhone("+38641696401") === true, "mobile e164");
  ok(isSlovenianMobilePhone("01 425 1234") === false, "landline 01");
  ok(isSlovenianMobilePhone("02 234 5678") === false, "landline 02");
  ok(isSlovenianMobilePhone("") === false, "empty not mobile");
  ok(isSlovenianMobilePhone("123") === false, "invalid not mobile");

  const rendered = renderSms({
    companyName: "Studio Test",
    demoUrl: "https://zbrendiraj.si/studio-test",
    hasExistingWebsite: false,
    step: "initial",
  });
  ok(rendered.text.includes("Studio Test"), "template company");
  ok(
    rendered.text.includes("https://zbrendiraj.si/studio-test"),
    "template url",
  );
  ok(rendered.text.includes("brezplačen predlog"), "initial copy");
  ok(!rendered.text.toLowerCase().includes("cena"), "no pricing in initial");
  ok(rendered.length > 0, "has length");

  const follow1 = renderSms({
    companyName: "Studio Test",
    demoUrl: "https://zbrendiraj.si/studio-test",
    hasExistingWebsite: false,
    step: "followup_1",
  });
  ok(follow1.text.includes("Samo preverjam"), "followup_1 copy");

  const follow2 = renderSms({
    companyName: "Studio Test",
    demoUrl: "https://zbrendiraj.si/studio-test",
    hasExistingWebsite: false,
    step: "followup_2",
  });
  ok(follow2.text.includes("Še zadnjič"), "followup_2 copy");
  ok(follow2.text.includes('"DA"'), "followup_2 DA CTA");

  const { smsCompanyDisplayName } = await import(
    "../src/outreach/sms/company-name"
  );
  ok(
    smsCompanyDisplayName("Bb elektro instalacije, Boštjan Bole s.p.") ===
      "Bb elektro instalacije",
    "strip legal personal tail",
  );
  ok(
    smsCompanyDisplayName("Studio Lepota") === "Studio Lepota",
    "keep simple brand",
  );
  ok(
    smsCompanyDisplayName("Acme d.o.o.") === "Acme",
    "strip trailing d.o.o.",
  );

  const long = analyzeSmsLength("x".repeat(500));
  ok(long.segments > 1, "long sms segments");

  const lead: LeadRecord = {
    slug: "milimeter-frizerski-salon",
    companyName: "Milimeter",
    phone: "041123456",
    status: "generated",
    url: "/milimeter-frizerski-salon",
  };

  ok(
    !evaluateSmsEligibility({
      lead,
      isCustomer: true,
      state: null,
      step: "initial",
      alreadySentForStep: false,
    }).ok,
    "customer blocked",
  );

  ok(
    !evaluateSmsEligibility({
      lead,
      isCustomer: false,
      state: {
        slug: lead.slug,
        normalizedPhone: "+38641123456",
        smsStatus: "opted_out",
        smsAllowed: false,
        smsSentAt: null,
        smsLastError: null,
        smsMessageId: null,
        smsReplyAt: null,
        updatedAt: new Date().toISOString(),
      },
      step: "initial",
      alreadySentForStep: false,
    }).ok,
    "opt-out blocked",
  );

  ok(
    !evaluateSmsEligibility({
      lead,
      isCustomer: false,
      state: null,
      step: "initial",
      alreadySentForStep: false,
      globallyOptedOut: true,
    }).ok,
    "global opt-out blocked",
  );

  ok(
    !evaluateSmsEligibility({
      lead,
      isCustomer: false,
      state: null,
      step: "initial",
      alreadySentForStep: true,
    }).ok,
    "duplicate step blocked",
  );

  // Exact production case: valid SI phone, generated demo, allowed, no history.
  const { readLead } = await import("../src/leads/store");
  const bb = readLead("bb-elektro-instalacije");
  ok(Boolean(bb), "bb-elektro lead exists");
  ok(Boolean(bb && clientSiteExists(bb.slug)), "bb-elektro demo site.json exists via cwd");
  if (bb) {
    const eligible = evaluateSmsEligibility({
      lead: bb,
      isCustomer: false,
      state: null,
      step: "initial",
      alreadySentForStep: false,
    });
    ok(eligible.ok === true, "bb-elektro SMS eligible");
    if (eligible.ok) {
      ok(eligible.phone === "+38641696401", "bb-elektro normalized phone");
    }
    ok(isRelevantSmsLead(bb) === true, "bb-elektro relevant SMS lead");
  }

  const demoSlug = "bb-elektro-instalacije";
  ok(clientSiteExists(demoSlug), "shared demo for relevance fixtures");

  ok(
    isRelevantSmsLead({
      slug: demoSlug,
      companyName: "Test",
      phone: "041 696 401",
      status: "generated",
      url: `/${demoSlug}`,
      existingWebsite: "",
    }) === true,
    "relevant: no website + mobile + demo",
  );

  ok(
    isRelevantSmsLead({
      slug: demoSlug,
      companyName: "Test",
      phone: "041 696 401",
      status: "generated",
      url: `/${demoSlug}`,
      existingWebsite: "https://example.com",
    }) === false,
    "not relevant: existing website",
  );

  ok(
    isRelevantSmsLead({
      slug: demoSlug,
      companyName: "Test",
      phone: "",
      status: "generated",
      url: `/${demoSlug}`,
    }) === false,
    "not relevant: no phone",
  );

  ok(
    isRelevantSmsLead({
      slug: demoSlug,
      companyName: "Test",
      phone: "123",
      status: "generated",
      url: `/${demoSlug}`,
    }) === false,
    "not relevant: invalid phone",
  );

  ok(
    isRelevantSmsLead({
      slug: demoSlug,
      companyName: "Test",
      phone: "01 425 1234",
      status: "generated",
      url: `/${demoSlug}`,
    }) === false,
    "not relevant: landline",
  );

  ok(
    isRelevantSmsLead({
      slug: "definitely-no-demo-slug-xyz",
      companyName: "Test",
      phone: "041 696 401",
      status: "discovered",
      url: "/definitely-no-demo-slug-xyz",
    }) === false,
    "not relevant: no demo",
  );

  ok(
    isRelevantSmsLead({
      slug: demoSlug,
      companyName: "Test",
      phone: "041 696 401",
      status: "generated",
      url: `/${demoSlug}`,
      // no email field
    }) === true,
    "relevant without email",
  );

  const {
    smsLeadReplenishmentNeeded,
    smsLeadReplenishToGenerate,
  } = await import("../src/outreach/sms/config");
  ok(smsLeadReplenishmentNeeded(140, 500) === 360, "replenish gap 140→500");
  ok(smsLeadReplenishmentNeeded(500, 500) === 0, "at target → 0");
  ok(smsLeadReplenishmentNeeded(520, 500) === 0, "above target → 0");
  ok(
    smsLeadReplenishToGenerate(140, { target: 500, batch: 100 }) === 100,
    "batch caps gap",
  );
  ok(
    smsLeadReplenishToGenerate(470, { target: 500, batch: 100 }) === 30,
    "gap smaller than batch",
  );

  const { isSmsGenerationCandidate } = await import(
    "../src/outreach/sms/relevance"
  );
  ok(
    isSmsGenerationCandidate({
      slug: "x",
      phone: "041 696 401",
      existingWebsite: "",
    }) === true,
    "gen candidate: mobile no website",
  );
  ok(
    isSmsGenerationCandidate({
      slug: "x",
      phone: "041 696 401",
      existingWebsite: "https://a.si",
    }) === false,
    "gen reject: website",
  );
  ok(
    isSmsGenerationCandidate({
      slug: "x",
      phone: "01 425 1234",
    }) === false,
    "gen reject: landline",
  );
  ok(
    isSmsGenerationCandidate({
      slug: "x",
      phone: "",
    }) === false,
    "gen reject: no phone",
  );

  const { replenishSmsLeads } = await import("../src/leads/replenish");
  const { createInitialProgress } = await import("../src/leads/discovery-progress");

  let matrixProgress = createInitialProgress();
  matrixProgress = {
    ...matrixProgress,
    currentRegionId: "zasavska",
    currentProfessionId: "frizerji",
  };

  const atTarget = await replenishSmsLeads({
    countActionable: async () => 520,
    readProgress: () => matrixProgress,
    writeProgress: (next) => {
      matrixProgress = next;
    },
    discover: async () => {
      throw new Error("discover should not run when at target");
    },
    createFromLead: async () => {
      throw new Error("generate should not run when at target");
    },
  });
  ok(atTarget.toGenerate === 0, "520 → no replenish");
  ok(atTarget.demosGenerated === 0, "520 → no demos");

  const exactlyTarget = await replenishSmsLeads({
    countActionable: async () => 500,
    readProgress: () => matrixProgress,
    writeProgress: (next) => {
      matrixProgress = next;
    },
    discover: async () => {
      throw new Error("discover should not run at exact target");
    },
  });
  ok(exactlyTarget.toGenerate === 0, "500 → no replenish");

  let discoverCalls = 0;
  let createCalls = 0;
  const created = new Set<string>();
  matrixProgress = createInitialProgress();
  matrixProgress = {
    ...matrixProgress,
    currentRegionId: "zasavska",
    currentProfessionId: "frizerji",
  };
  const below = await replenishSmsLeads({
    countActionable: async () => 499,
    maxSearchesPerRun: 5,
    zeroYieldCompletionStreak: 99,
    readProgress: () => matrixProgress,
    writeProgress: (next) => {
      matrixProgress = next;
    },
    placesLimitPerQuery: 5,
    discover: async () => {
      discoverCalls += 1;
      return [
        {
          outcome: "skipped",
          reason: "already known",
          companyName: "Dup",
          googlePlaceId: "p1",
        },
        {
          outcome: "discovered",
          slug: "lead-website",
          companyName: "Has Web",
          googlePlaceId: "p2",
        },
        {
          outcome: "discovered",
          slug: "lead-landline",
          companyName: "Land",
          googlePlaceId: "p3",
        },
        {
          outcome: "discovered",
          slug: "lead-nophone",
          companyName: "NoPhone",
          googlePlaceId: "p4",
        },
        {
          outcome: "discovered",
          slug: "lead-fail",
          companyName: "Fail",
          googlePlaceId: "p6",
        },
        {
          outcome: "discovered",
          slug: "lead-good",
          companyName: "Good",
          googlePlaceId: "p5",
        },
      ];
    },
    readLeadBySlug: (slug) => {
      if (slug === "lead-website") {
        return {
          slug,
          phone: "041111111",
          existingWebsite: "https://x.si",
        };
      }
      if (slug === "lead-landline") {
        return { slug, phone: "01 425 1234", existingWebsite: "" };
      }
      if (slug === "lead-nophone") {
        return { slug, phone: "", existingWebsite: "" };
      }
      if (slug === "lead-good" || slug === "lead-fail") {
        return { slug, phone: "041 696 401", existingWebsite: "" };
      }
      return null;
    },
    siteExists: (slug) => created.has(slug),
    createFromLead: async (slug) => {
      createCalls += 1;
      if (slug === "lead-fail") {
        throw new Error("demo boom");
      }
      created.add(slug);
      return { outcome: "created", slug, companyName: slug };
    },
  });

  ok(below.needed === 1, "499→500 needed");
  ok(below.toGenerate === 1, "toGenerate capped to gap");
  ok(below.duplicates >= 1, "dedup counted");
  ok(below.rejectedExistingWebsite >= 1, "website rejected before gen");
  ok(below.rejectedInvalidOrLandline >= 1, "landline rejected");
  ok(below.rejectedMissingPhone >= 1, "missing phone rejected");
  ok(below.demosGenerated === 1, "one successful demo");
  ok(below.errors.some((e) => e.includes("demo boom")), "gen failure logged");
  ok(discoverCalls >= 1, "discover ran");
  ok(createCalls >= 2, "fail then success create attempts");

  const batchCap = await replenishSmsLeads({
    countActionable: async () => 140,
    maxSearchesPerRun: 50,
    zeroYieldCompletionStreak: 99,
    readProgress: () => matrixProgress,
    writeProgress: (next) => {
      matrixProgress = next;
    },
    placesLimitPerQuery: 50,
    discover: async () =>
      Array.from({ length: 50 }, (_, i) => ({
        outcome: "discovered" as const,
        slug: `batch-${i}`,
        companyName: `B${i}`,
        googlePlaceId: `g${i}`,
      })),
    readLeadBySlug: (slug) => ({
      slug,
      phone: "041 696 401",
      existingWebsite: "",
    }),
    siteExists: () => false,
    createFromLead: async (slug) => ({
      outcome: "created",
      slug,
      companyName: slug,
    }),
  });
  ok(batchCap.demosGenerated <= batchCap.toGenerate, "never exceed toGenerate");
  ok(batchCap.toGenerate <= 100, "default batch ceiling");

  const {
    buildSearchSurface,
    combinationKey,
  } = await import("../src/leads/discovery-matrix");
  const {
    markQueryCompleted,
    readDiscoveryProgress,
    writeDiscoveryProgress,
  } = await import("../src/leads/discovery-progress");

  const surface = buildSearchSurface("zasavska", "frizerji");
  ok(surface.highValueQueries.length > 1, "matrix surface has town queries");

  let progressState = createInitialProgress();
  const key = combinationKey("zasavska", "frizerji");
  let combo = progressState.combinations[key]!;
  combo = {
    ...combo,
    status: "active",
    highValueQueries: surface.highValueQueries,
    optionalQueries: surface.optionalQueries,
  };
  progressState = {
    ...progressState,
    currentRegionId: "zasavska",
    currentProfessionId: "frizerji",
    combinations: { ...progressState.combinations, [key]: combo },
  };
  combo = markQueryCompleted(combo, surface.highValueQueries[0]!, 0);
  combo = markQueryCompleted(combo, surface.highValueQueries[0]!, 0);
  ok(combo.queriesCompleted.length === 1, "matrix progress dedupes completed query");
  ok(combo.zeroYieldStreak === 2, "matrix zero-yield streak tracked");

  const tempDir = mkdtempSync(join(tmpdir(), "matrix-test-"));
  const progressPath = join(tempDir, "lead-discovery-progress.json");
  writeDiscoveryProgress(progressState, progressPath);
  ok(existsSync(progressPath), "matrix progress file written");
  const loaded = readDiscoveryProgress(progressPath);
  ok(loaded.combinations[key]!.queriesCompleted.length === 1, "matrix progress reloads");

  let discoverCallsMatrix = 0;
  progressState = createInitialProgress();
  progressState = {
    ...progressState,
    currentRegionId: "zasavska",
    currentProfessionId: "frizerji",
  };
  await replenishSmsLeads({
    countActionable: async () => 499,
    maxSearchesPerRun: 1,
    zeroYieldCompletionStreak: 99,
    readProgress: () => progressState,
    writeProgress: (next) => {
      progressState = next;
    },
    placesLimitPerQuery: 5,
    discover: async (_query, _limit, options) => {
      discoverCallsMatrix += 1;
      ok(options?.requireMobilePhone === true, "replenish requires mobile at discover");
      return [
        {
          outcome: "discovered",
          slug: "lead-good",
          companyName: "Good",
          googlePlaceId: "p5",
        },
      ];
    },
    readLeadBySlug: () => ({
      slug: "lead-good",
      phone: "041 696 401",
      existingWebsite: "",
    }),
    siteExists: () => false,
    createFromLead: async (slug) => ({
      outcome: "created",
      slug,
      companyName: slug,
    }),
  });
  ok(discoverCallsMatrix === 1, "matrix replenish runs one discover per iteration");

  ok(isOptOutMessage("STOP"), "STOP");
  ok(isOptOutMessage("stop"), "stop");
  ok(isOptOutMessage("STOP!"), "STOP!");
  ok(isOptOutMessage(" NE"), "NE padded");
  ok(isOptOutMessage("ne"), "ne");
  ok(isOptOutMessage(" odjava "), "ODJAVA");
  ok(isOptOutMessage("odjava"), "odjava");
  ok(isOptOutMessage("stop sms"), "stop sms");
  ok(!isOptOutMessage("NE BOM DANES"), "NE BOM DANES not opt-out");
  ok(!isOptOutMessage("NEKAJ"), "NEKAJ not opt-out");
  ok(!isOptOutMessage("Zanima me, ne zdaj"), "ne inside sentence not opt-out");
  ok(!isOptOutMessage("Zanima me demo"), "normal reply");
  ok(!isOptOutMessage("DA"), "DA is not opt-out");
  ok(parseSmsOptOut("STOP").keyword === "STOP", "keyword STOP");
  ok(parseSmsOptOut("ne").keyword === "NE", "keyword NE");
  ok(parseSmsOptOut("ODJAVA").keyword === "ODJAVA", "keyword ODJAVA");
  ok(canCancelOnOptOut("queued"), "cancel queued");
  ok(canCancelOnOptOut("claimed"), "cancel claimed");
  ok(!canCancelOnOptOut("sending"), "do not cancel sending");
  ok(!canCancelOnOptOut("sent"), "do not cancel sent");

  const { DryRunModem } = await import(
    "../tools/sms-gateway/src/modem/dry-run"
  );
  const modem = new DryRunModem();
  const status = await modem.getStatus();
  ok(status.mode === "dry-run", "dry-run status");
  const send = await modem.sendSms("+38641123456", "test");
  ok(send.success === true, "dry-run send success");

  console.log("test-sms-outreach: all assertions passed");
}

void main();
