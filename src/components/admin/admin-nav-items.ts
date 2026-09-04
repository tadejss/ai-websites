import {
  ClipboardCheck,
  Factory,
  Home,
  Kanban,
  LayoutList,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Home", icon: Home, exact: true },
  { href: "/admin/review", label: "Onboarding", icon: ClipboardCheck },
  { href: "/admin/leads", label: "Leads", icon: LayoutList },
  { href: "/admin/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/admin/sms", label: "SMS", icon: MessageSquare },
  { href: "/admin/factory", label: "Factory", icon: Factory },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
] as const;

export function isAdminNavActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
