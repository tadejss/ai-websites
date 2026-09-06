import { cookies } from "next/headers";
import { isCustomer } from "@/customers/store";
import {
  getOnboardingBySlug,
  isValidOnboardingToken,
} from "@/onboarding/store";
import {
  ONBOARDING_SESSION_COOKIE,
  validateOnboardingSession,
} from "@/lib/onboarding-session";
import { isTrustedMutationOrigin } from "@/lib/csrf";

export type OnboardingAccessResult =
  | { ok: true; slug: string }
  | { ok: false; status: number; error: string };

/**
 * Verify the long-lived emailed capability token (exchange / first visit only).
 * Does not grant ongoing API access — call createOnboardingSession after this.
 */
export async function verifyOnboardingCapabilityToken(
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

/**
 * Authorize onboarding API/page access via the HttpOnly session cookie.
 * Session is bound to slug — changing the URL slug cannot bypass binding.
 *
 * @deprecated Prefer verifyOnboardingSessionAccess. Kept name for call-site clarity
 * during migration; capability tokens are no longer accepted for API access.
 */
export async function verifyOnboardingAccess(
  slug: string,
  _ignoredToken?: string | null,
): Promise<OnboardingAccessResult> {
  return verifyOnboardingSessionAccess(slug);
}

export async function verifyOnboardingSessionAccess(
  slug: string,
): Promise<OnboardingAccessResult> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ONBOARDING_SESSION_COOKIE)?.value;
  const session = await validateOnboardingSession(sessionToken, slug);

  if (!session.ok) {
    if (session.reason === "missing") {
      return { ok: false, status: 401, error: "Missing session" };
    }
    if (session.reason === "slug_mismatch") {
      return { ok: false, status: 403, error: "Forbidden" };
    }
    if (session.reason === "expired" || session.reason === "revoked") {
      return { ok: false, status: 401, error: "Session expired" };
    }
    return { ok: false, status: 403, error: "Invalid session" };
  }

  const customer = await isCustomer(slug);
  if (!customer) {
    return { ok: false, status: 403, error: "Not a customer" };
  }

  return { ok: true, slug: session.slug };
}

/**
 * Cookie-authenticated onboarding mutations also require a trusted Origin.
 */
export async function verifyOnboardingMutationAccess(
  request: Request,
  slug: string,
): Promise<OnboardingAccessResult> {
  if (!isTrustedMutationOrigin(request)) {
    return { ok: false, status: 403, error: "Forbidden origin" };
  }
  return verifyOnboardingSessionAccess(slug);
}
