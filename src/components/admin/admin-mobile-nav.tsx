"use client";

import Link from "next/link";
import { AdminBrandMark, AdminWordmark } from "@/components/admin/admin-brand";
import { cn } from "@/lib/utils";

export function AdminMobileNav({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center px-3 py-2", className)}>
      <Link href="/admin" className="flex min-w-0 items-center gap-2">
        <AdminBrandMark size={32} />
        <AdminWordmark className="text-lg" />
      </Link>
    </div>
  );
}
