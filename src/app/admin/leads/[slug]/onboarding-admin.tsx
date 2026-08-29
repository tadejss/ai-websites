"use client";

type Props = {
  url: string;
};

export function AdminCopyOnboardingLink({ url }: Props) {
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard.writeText(url)}
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
    >
      Copy onboarding link
    </button>
  );
}

export function AdminPublishLivePlaceholder() {
  return (
    <button
      type="button"
      disabled
      title="Objava LIVE bo na voljo v naslednji fazi"
      className="cursor-not-allowed rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600"
    >
      Objavi LIVE (kmalu)
    </button>
  );
}
