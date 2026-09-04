import { revalidatePath, revalidateTag } from "next/cache";

export const ADMIN_INDEX_TAG = "admin-entity-index";
export const ADMIN_QUEUE_TAG = "admin-queue";

export function revalidateAdminIndex(): void {
  revalidateTag(ADMIN_INDEX_TAG, "max");
}

export function revalidateAdminQueue(): void {
  revalidateTag(ADMIN_QUEUE_TAG, "max");
}

/** ISR bust for `/{slug}` (`revalidate = 300`). Overlay itself reads Neon on render. */
export function revalidateCustomerPage(slug: string): void {
  if (!slug.trim()) {
    return;
  }
  revalidatePath(`/${slug.trim()}`);
}

export async function afterAdminMutation(slug?: string): Promise<void> {
  revalidateAdminIndex();
  revalidateAdminQueue();
  if (slug) {
    revalidateCustomerPage(slug);
  }
}
