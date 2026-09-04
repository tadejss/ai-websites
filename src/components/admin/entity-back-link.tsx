"use client";

import { useRouter } from "next/navigation";

export function EntityBackLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push("/admin");
      }}
      className="text-xs text-[var(--admin-accent)] hover:underline"
    >
      ← Back
    </button>
  );
}
