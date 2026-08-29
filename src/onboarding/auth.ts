import { isCustomer } from "@/customers/store";
import {
  getOnboardingBySlug,
  isValidOnboardingToken,
} from "@/onboarding/store";

export type OnboardingAccessResult =
  | { ok: true; slug: string }
  | { ok: false; status: number; error: string };

export async function verifyOnboardingAccess(
  slug: string,
  token: string | null | undefined,
): Promise<OnboardingAccessResult> {
  if (!token?.trim()) {
    return { ok: false, status: 401, error: "Missing token" };
  }

  const record = await getOnboardingBySlug(slug);
  if (!record || !isValidOnboardingToken(record, token)) {
    return { ok: false, status: 403, error: "Invalid token" };
  }

  const customer = await isCustomer(slug);
  if (!customer) {
    return { ok: false, status: 403, error: "Not a customer" };
  }

  return { ok: true, slug };
}
