"use client";

import Link from "next/link";
import { AdminBrandMark } from "@/components/admin/admin-brand";
import { cn } from "@/lib/utils";

export function AdminMobileNav({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center px-3 py-2", className)}>
      <Link href="/admin" className="flex items-center justify-center" aria-label="Zbrendiraj.si">
        <AdminBrandMark size={32} />
      </Link>
    </div>
  );
}
