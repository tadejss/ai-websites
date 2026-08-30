import assert from "node:assert/strict";
import { normalizeSlovenianPhone } from "../src/outreach/sms/phone";
import { analyzeSmsLength, renderSms } from "../src/outreach/sms/templates";
import { evaluateSmsEligibility } from "../src/outreach/sms/eligibility";
import { isOptOutMessage } from "../src/outreach/sms/opt-out";
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
      alreadySentForStep: true,
    }).ok,
    "duplicate step blocked",
  );

  // Exact production case: valid SI phone, generated demo, allowed, no history.
  const { readLead } = await import("../src/leads/store");
  const { clientSiteExists } = await import("../src/leads/client-exists");
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
  }

  ok(isOptOutMessage("STOP"), "STOP");
  ok(isOptOutMessage(" odjava "), "ODJAVA");
  ok(isOptOutMessage("Ne"), "NE exact");
  ok(isOptOutMessage("stop sms"), "stop sms");
  ok(!isOptOutMessage("Zanima me, ne zdaj"), "ne inside sentence not opt-out");
  ok(!isOptOutMessage("Zanima me demo"), "normal reply");

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
