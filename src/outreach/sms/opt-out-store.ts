import { readLead } from "@/leads/store";
import { normalizeSlovenianPhone } from "./phone";
import {
  cancelQueuedAndClaimedForPhone,
  upsertSmsLeadState,
  upsertSmsOptOut,
} from "./store";

export type ApplyAdminSmsOptOutErrorCode = "lead_not_found" | "invalid_phone";

export class ApplyAdminSmsOptOutError extends Error {
  readonly code: ApplyAdminSmsOptOutErrorCode;

  constructor(code: ApplyAdminSmsOptOutErrorCode, message: string) {
    super(message);
    this.name = "ApplyAdminSmsOptOutError";
    this.code = code;
  }
}

export type ApplyAdminSmsOptOutResult = {
  cancelledCount: number;
  phone: string;
};

/**
 * Server-side orchestration for admin SMS opt-out.
 * Owns lead read, phone normalization, and store mutations.
 * Idempotent under repeated calls / races.
 */
export async function applyAdminSmsOptOutForLead(input: {
  slug: string;
  source: string;
  reason: string;
}): Promise<ApplyAdminSmsOptOutResult> {
  const lead = readLead(input.slug);
  if (!lead) {
    throw new ApplyAdminSmsOptOutError("lead_not_found", "Lead not found");
  }

  const phone = normalizeSlovenianPhone(lead.phone);
  if (!phone.ok) {
    throw new ApplyAdminSmsOptOutError(
      "invalid_phone",
      phone.error || "Invalid phone number",
    );
  }

  await upsertSmsOptOut({
    phone: phone.e164,
    source: input.source,
    reason: input.reason,
  });

  await upsertSmsLeadState({
    slug: input.slug,
    normalizedPhone: phone.e164,
    smsStatus: "opted_out",
    smsAllowed: false,
  });

  const cancelledCount = await cancelQueuedAndClaimedForPhone(phone.e164);

  return {
    cancelledCount,
    phone: phone.e164,
  };
}
