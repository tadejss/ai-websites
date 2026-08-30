import { isCustomer } from "@/customers/store";
import { getOnboardingBySlug, getOnboardingUrl } from "./store";

export type CustomerChromeState = {
  isCustomer: boolean;
  onboardingUrl: string | null;
  contactName: string | null;
};

/** Read-only customer/onboarding state for demo pages. Never writes to DB. */
export async function getCustomerChromeState(
  slug: string,
): Promise<CustomerChromeState> {
  try {
    const customer = await isCustomer(slug);
    if (!customer) {
      return { isCustomer: false, onboardingUrl: null, contactName: null };
    }

    const onboarding = await getOnboardingBySlug(slug);
    if (!onboarding) {
      return { isCustomer: true, onboardingUrl: null, contactName: null };
    }

    return {
      isCustomer: true,
      onboardingUrl: getOnboardingUrl(slug, onboarding.accessToken),
      contactName: onboarding.contactName,
    };
  } catch (error) {
    console.warn(
      "[onboarding] customer chrome read skipped:",
      error instanceof Error ? error.message : error,
    );
    return { isCustomer: false, onboardingUrl: null, contactName: null };
  }
}
