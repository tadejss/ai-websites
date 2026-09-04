import type { OnboardingRecord } from "./types";

/** Canonical desired website domain from onboarding answers or processed payload. */
export function getOnboardingDesiredDomain(
  onboarding:
    | Pick<OnboardingRecord, "answers" | "processedPayload">
    | null
    | undefined,
): string | null {
  if (!onboarding) {
    return null;
  }

  const fromAnswers = onboarding.answers?.desiredDomain?.trim();
  if (fromAnswers) {
    return fromAnswers;
  }

  const fromPayload =
    onboarding.processedPayload?.siteHints?.desiredDomain?.trim();
  if (fromPayload) {
    return fromPayload;
  }

  return null;
}
