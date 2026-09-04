import Link from "next/link";
import { getActionQueue } from "@/admin/queue";
import { loadAdminEntity } from "@/admin/load-entity";
import { listOnboardingImages } from "@/onboarding/images";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { ReviewModeClient } from "@/components/admin/review-mode-client";

export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
  const allItems = await getActionQueue(200);
  const reviewItems = allItems.filter(
    (item) => item.kind === "onboarding_review",
  );

  const enriched = await Promise.all(
    reviewItems.slice(0, 30).map(async (item) => {
      const entity = await loadAdminEntity(item.slug);
      return {
        slug: item.slug,
        companyName: item.companyName,
        actions: item.actions,
        galleryCount: entity?.onboarding
          ? listOnboardingImages(entity.onboarding.answers).length
          : 0,
        answers: entity?.onboarding?.answers ?? null,
      };
    }),
  );

  return (
    <div>
      <AdminPageHeader
        title="Rapid onboarding review"
        description={`${reviewItems.length} waiting for approval`}
        actions={
          <Link href="/admin" className="text-xs text-[var(--admin-accent)] hover:underline">
            ← Queue
          </Link>
        }
      />
      {enriched.length === 0 ? (
        <p className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-4 py-8 text-center text-sm text-[var(--admin-muted)]">
          No onboarding waiting for review
        </p>
      ) : (
        <ReviewModeClient items={enriched} />
      )}
    </div>
  );
}
