import {
  LayoutDashboard,
  Package,
  FolderTree,
  Newspaper,
  BookOpen,
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
  /** false = reachable from its parent page and the command palette, but not
   *  listed in the sidebar. Keeps the sidebar to the handful of places a
   *  client actually goes. */
  inSidebar?: boolean;
  /** Other routes that light this item up in the sidebar — the hidden pages
   *  that live under it. */
  activeFor?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, group: "Overview", activeFor: ["/analytics"] },
  { href: "/leads", label: "Enquiries", icon: Inbox, group: "Overview" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, group: "Overview", inSidebar: false },
  { href: "/products", label: "Products", icon: Package, group: "Catalog", activeFor: ["/categories"] },
  { href: "/categories", label: "Categories", icon: FolderTree, group: "Catalog", inSidebar: false },
  { href: "/news", label: "News", icon: Newspaper, group: "Catalog" },
  { href: "/resources", label: "Resources", icon: BookOpen, group: "Catalog" },
  { href: "/team", label: "Team", icon: Users, group: "Workspace", inSidebar: false },
  { href: "/settings", label: "Settings", icon: Settings, group: "Workspace", activeFor: ["/team"] },
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

export function isItemActive(pathname: string, item: NavItem): boolean {
  return [item.href, ...(item.activeFor ?? [])].some((h) => isActive(pathname, h));
}
