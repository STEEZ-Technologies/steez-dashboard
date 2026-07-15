import {
  LayoutDashboard,
  Package,
  FolderTree,
  BarChart3,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Overview" | "Catalog" | "Workspace";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, group: "Overview" },
  { href: "/products", label: "Products", icon: Package, group: "Catalog" },
  { href: "/categories", label: "Categories", icon: FolderTree, group: "Catalog" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, group: "Overview" },
  { href: "/team", label: "Team", icon: Users, group: "Workspace" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Workspace" },
];

export const NAV_GROUPS = ["Overview", "Catalog", "Workspace"] as const;

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
