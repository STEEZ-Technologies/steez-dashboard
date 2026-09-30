"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV_GROUPS, NAV_ITEMS, isItemActive } from "./nav-items";
import { UserMenu } from "./user-menu";
import { signOutAction } from "@/app/(dashboard)/actions";
import { useT } from "@/lib/i18n/provider";
import { STEEZWordmark } from "@/components/shared/steez-wordmark";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

const NAV_LABEL_KEY: Record<string, keyof Dictionary["nav"]> = {
  "/": "overview",
  "/leads": "leads",
  "/products": "products",
  "/categories": "categories",
  "/news": "news",
  "/resources": "resources",
  "/team": "team",
  "/settings": "settings",
  "/admin": "admin",
};

const GROUP_LABEL_KEY: Record<string, keyof Dictionary["nav"]> = {
  Overview: "groupOverview",
  Catalog: "groupCatalog",
  Workspace: "groupWorkspace",
  Platform: "groupPlatform",
};

export function AppSidebar({
  tenantName,
  email,
  displayName = null,
  avatarUrl = null,
  role,
  newLeadCount = 0,
  isSuperAdmin = false,
  isPlatformWorkspace = false,
}: {
  tenantName: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: string;
  /** Unread enquiries — surfaced as a badge so the inbox gets checked daily. */
  newLeadCount?: number;
  isSuperAdmin?: boolean;
  /** STEEZ's own workspace has no catalog — only Workspace and Platform apply. */
  isPlatformWorkspace?: boolean;
}) {
  const pathname = usePathname();
  const { dict } = useT();
  // Going to another page closes the sidebar: the phone drawer shuts, and on
  // desktop it collapses to its icon rail, so the page gets the room. Reopen
  // it with the toggle in the header. Keyed off the path changing rather than
  // the link's onClick — collapsing mid-click re-renders the menu (it gains
  // tooltips when collapsed) and swallowed the navigation itself. The first
  // render is skipped, so a page load keeps whatever state was saved.
  const { setOpen, setOpenMobile } = useSidebar();
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    setOpenMobile(false);
    setOpen(false);
  }, [pathname, setOpen, setOpenMobile]);

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex items-baseline gap-1.5 overflow-hidden group-data-[collapsible=icon]:hidden">
            <STEEZWordmark size={18} color="var(--sidebar-foreground)" />
            <span className="cn-text text-sm font-bold text-sidebar-primary">
              思智
            </span>
          </div>
        </div>
        <p className="eyebrow px-2 group-data-[collapsible=icon]:hidden">
          {tenantName}
        </p>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter(
            (i) =>
              i.group === group &&
              i.inSidebar !== false &&
              (!i.superAdminOnly || isSuperAdmin) &&
              (!isPlatformWorkspace || i.group === "Workspace" || i.group === "Platform"),
          );
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel>
                {dict.nav[GROUP_LABEL_KEY[group]]}
              </SidebarGroupLabel>
              <SidebarMenu>
                {items.map((item) => {
                  const active = isItemActive(pathname, item);
                  const label = dict.nav[NAV_LABEL_KEY[item.href]] ?? item.label;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={label}
                        className="rounded-full data-active:font-semibold"
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{label}</span>
                        {item.href === "/leads" && newLeadCount > 0 && (
                          <span className="ml-auto rounded-full bg-[var(--chart-2)] px-1.5 py-0.5 text-[0.65rem] font-bold leading-none text-[var(--forest)] group-data-[collapsible=icon]:hidden">
                            {newLeadCount}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <UserMenu
          email={email}
          displayName={displayName}
          avatarUrl={avatarUrl}
          role={role}
          onSignOut={() => signOutAction()}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
