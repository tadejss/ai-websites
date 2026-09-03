import { getCachedCustomerSlugSet } from "@/customers/slug-cache";
import { getBusinessEmailCustomerView } from "@/email/customer-view";
import type { BusinessEmailCustomerView } from "@/email/types";
import { getOnboardingBySlug, getOnboardingUrl } from "./store";
import type { OnboardingStatus } from "./types";

export type CustomerChromeState = {
  isCustomer: boolean;
  onboardingUrl: string | null;
  contactName: string | null;
  onboardingStatus: OnboardingStatus | null;
  businessEmail: BusinessEmailCustomerView | null;
};

/** Read-only customer/onboarding state for demo pages. Never writes to DB. */
export async function getCustomerChromeState(
  slug: string,
): Promise<CustomerChromeState> {
  try {
    const customerSlugList = await getCachedCustomerSlugSet();
    const customerSlugs = new Set(customerSlugList);
    if (!customerSlugs.has(slug)) {
      return {
        isCustomer: false,
        onboardingUrl: null,
        contactName: null,
        onboardingStatus: null,
        businessEmail: null,
      };
    }

    const onboarding = await getOnboardingBySlug(slug);
    const businessEmail = await getBusinessEmailCustomerView(slug);
    if (!onboarding) {
      return {
        isCustomer: true,
        onboardingUrl: null,
        contactName: null,
        onboardingStatus: null,
        businessEmail,
      };
    }

    return {
      isCustomer: true,
      onboardingUrl: getOnboardingUrl(slug, onboarding.accessToken),
      contactName: onboarding.contactName,
      onboardingStatus: onboarding.status,
      businessEmail,
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
      businessEmail: null,
    };
  }
}
