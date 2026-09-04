import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { WebsiteDomainsClient } from "@/components/admin/website-domains-client";
import { listWebsiteDomainAdminQueue } from "@/website-domains/admin-queue";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ slug?: string }>;
};

export default async function AdminDomainsPage({ searchParams }: Props) {
  const params = await searchParams;
  const focusSlug = params.slug?.trim() || null;

  let rows: Awaited<ReturnType<typeof listWebsiteDomainAdminQueue>> = [];
  let loadError: string | null = null;

  try {
    rows = await listWebsiteDomainAdminQueue();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Neon query failed";
  }

  const focusMissing =
    Boolean(focusSlug) &&
    !loadError &&
    !rows.some((row) => row.slug === focusSlug);

  const displayRows =
    focusSlug && !focusMissing
      ? [
          ...rows.filter((row) => row.slug === focusSlug),
          ...rows.filter((row) => row.slug !== focusSlug),
        ]
      : rows;

  return (
    <div>
      <AdminPageHeader
        title="Custom URL"
        description={`${rows.length} strank z dostopom do povezave domene`}
        actions={
          <Link
            href="/admin/review"
            className="text-xs text-[var(--admin-accent)] hover:underline"
          >
            ← Onboarding
          </Link>
        }
      />

      {loadError ? (
        <p className="rounded-[var(--admin-radius)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </p>
      ) : (
        <WebsiteDomainsClient
          rows={displayRows}
          focusSlug={focusSlug}
          focusMissing={focusMissing}
        />
      )}
    </div>
  );
}
