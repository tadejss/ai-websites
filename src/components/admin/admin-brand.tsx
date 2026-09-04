import Image from "next/image";
import { cn } from "@/lib/utils";
import { ZBRENDIRAJ_FALLBACK_ICON } from "@/lib/branding";

export const ZBRENDIRAJ_ADMIN_LOGO = "/brand/zbrendiraj-si/logo.png";
export const ZBRENDIRAJ_ADMIN_ICON = ZBRENDIRAJ_FALLBACK_ICON;

export function AdminBrandMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={ZBRENDIRAJ_ADMIN_LOGO}
      alt="Zbrendiraj.si"
      width={size}
      height={size}
      className={cn("rounded-xl", className)}
      priority
    />
  );
}

export function AdminWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-2xl leading-none text-white", className)}>
      Zbrendiraj.si
    </span>
  );
}
