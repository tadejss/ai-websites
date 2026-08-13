import { getDueOutreachStep, isLeadEligibleForOutreach } from "../src/outreach/eligibility";
import { wasStepAlreadySent } from "../src/outreach/eligibility";
import type { LeadRecord } from "../src/leads/store";
import { renderOutreachEmail } from "../src/outreach/templates";
import { buildEmailTemplateContext } from "../src/outreach/build-context";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const baseLead: LeadRecord = {
  slug: "test-salon",
  url: "/test-salon",
  companyName: "Test Salon",
  industry: "Frizerski salon",
  address: "Ulica 1, 1000 Ljubljana, Slovenia",
  status: "generated",
  email: "owner@example.com",
};

assert(!isLeadEligibleForOutreach({ ...baseLead, status: "do_not_contact" }), "do_not_contact should block");
assert(isLeadEligibleForOutreach(baseLead) === false, "missing site file should block");

const generatedLead: LeadRecord = {
  ...baseLead,
  slug: "milimeter-frizerski-salon",
  url: "/milimeter-frizerski-salon",
  email: "test@example.com",
};

assert(
  getDueOutreachStep(generatedLead) === "initial" || !isLeadEligibleForOutreach(generatedLead),
  "initial step logic",
);

const contactedLead: LeadRecord = {
  ...generatedLead,
  status: "contacted",
  outreach: {
    initialSentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

assert(getDueOutreachStep(contactedLead) === "followup_1", "followup 1 due after 3 days");
assert(wasStepAlreadySent(contactedLead, "initial"), "initial should be marked sent");

const context = buildEmailTemplateContext({
  ...generatedLead,
  email: "test@example.com",
});

assert(context !== null, "context should build with email");
const email = renderOutreachEmail("initial", context!);
assert(email.subject.includes("Test Salon"), "subject should include company name");
assert(email.text.includes("Predogled:"), "text should include preview link");

console.log("Outreach tests passed.");
