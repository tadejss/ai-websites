"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEntity = pathname.startsWith("/admin/e/");

  return (
    <main
      className={cn(
        "min-w-0 flex-1 overflow-x-hidden p-4 md:p-6",
        !isEntity && "max-md:pb-28",
      )}
    >
      {children}
    </main>
  );
}
