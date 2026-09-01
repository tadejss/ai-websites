import { revalidateTag } from "next/cache";

export const ADMIN_INDEX_TAG = "admin-entity-index";
export const ADMIN_QUEUE_TAG = "admin-queue";

export function revalidateAdminIndex(): void {
  revalidateTag(ADMIN_INDEX_TAG, "max");
}

export function revalidateAdminQueue(): void {
  revalidateTag(ADMIN_QUEUE_TAG, "max");
}

export async function afterAdminMutation(): Promise<void> {
  revalidateAdminIndex();
  revalidateAdminQueue();
}
