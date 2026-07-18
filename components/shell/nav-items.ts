import {
  LayoutDashboard,
  Package,
  FolderTree,
  BarChart3,
  Users,
  Settings,
  Inbox,
  Building2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Overview" | "Catalog" | "Workspace" | "Platform";
  /** Only rendered for STEEZ platform staff (see lib/super-admin.ts). */
  superAdminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, group: "Overview" },
  { href: "/leads", label: "Enquiries", icon: Inbox, group: "Overview" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, group: "Overview" },
  { href: "/products", label: "Products", icon: Package, group: "Catalog" },
  { href: "/categories", label: "Categories", icon: FolderTree, group: "Catalog" },
  { href: "/team", label: "Team", icon: Users, group: "Workspace" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Workspace" },
  {
    href: "/admin",
    label: "Tenants",
    icon: Building2,
    group: "Platform",
    superAdminOnly: true,
  },
];

export const NAV_GROUPS = ["Overview", "Catalog", "Workspace", "Platform"] as const;

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
