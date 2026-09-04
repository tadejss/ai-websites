import {
  Activity,
  Factory,
  Inbox,
  Kanban,
  LayoutGrid,
  LayoutList,
  MessageSquare,
  Settings,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Inbox", icon: Inbox, exact: true },
  { href: "/admin/review", label: "Review", icon: Star },
  { href: "/admin/leads", label: "Leads", icon: LayoutList },
  { href: "/admin/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/admin/sms", label: "SMS", icon: MessageSquare },
  { href: "/admin/factory", label: "Factory", icon: Factory },
  { href: "/admin/catalog", label: "Catalog", icon: LayoutGrid },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
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
