import { getCachedCustomerSlugSet } from "@/customers/slug-cache";
import { getOnboardingBySlug, getOnboardingUrl } from "./store";
import type { OnboardingStatus } from "./types";

export type CustomerChromeState = {
  isCustomer: boolean;
  onboardingUrl: string | null;
  contactName: string | null;
  onboardingStatus: OnboardingStatus | null;
};

/** Read-only customer/onboarding state for demo pages. Never writes to DB. */
export async function getCustomerChromeState(
  slug: string,
): Promise<CustomerChromeState> {
  try {
    const customerSlugs = await getCachedCustomerSlugSet();
    if (!customerSlugs.has(slug)) {
      return {
        isCustomer: false,
        onboardingUrl: null,
        contactName: null,
        onboardingStatus: null,
      };
    }

    const onboarding = await getOnboardingBySlug(slug);
    if (!onboarding) {
      return {
        isCustomer: true,
        onboardingUrl: null,
        contactName: null,
        onboardingStatus: null,
      };
    }

    return {
      isCustomer: true,
      onboardingUrl: getOnboardingUrl(slug, onboarding.accessToken),
      contactName: onboarding.contactName,
      onboardingStatus: onboarding.status,
    };
  } catch (error) {
    console.warn(
      "[onboarding] customer chrome read skipped:",
      error instanceof Error ? error.message : error,
    );
    return {
      isCustomer: false,
      onboardingUrl: null,
      contactName: null,
      onboardingStatus: null,
    };
  }
}
