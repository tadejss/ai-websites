import { revalidatePath, revalidateTag } from "next/cache";
import { publicOnboardingTag } from "@/onboarding/public-onboarding-cache";

export const ADMIN_INDEX_TAG = "admin-entity-index";
export const ADMIN_QUEUE_TAG = "admin-queue";

export function revalidateAdminIndex(): void {
  revalidateTag(ADMIN_INDEX_TAG, "max");
}

export function revalidateAdminQueue(): void {
  revalidateTag(ADMIN_QUEUE_TAG, "max");
}

/** ISR + public onboarding Data Cache bust for `/{slug}` (`revalidate = 300`). */
export function revalidateCustomerPage(slug: string): void {
  const trimmed = slug.trim();
  if (!trimmed) {
    return;
  }
  revalidatePath(`/${trimmed}`);
  revalidateTag(publicOnboardingTag(trimmed), "max");
}

export async function afterAdminMutation(slug?: string): Promise<void> {
  revalidateAdminIndex();
  revalidateAdminQueue();
  if (slug) {
    revalidateCustomerPage(slug);
  }
}
