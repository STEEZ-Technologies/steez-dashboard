"use client";

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
} from "@/components/ui/sidebar";
import { NAV_GROUPS, NAV_ITEMS, isActive } from "./nav-items";
import { UserMenu } from "./user-menu";
import { signOutAction } from "@/app/(dashboard)/actions";
import { useT } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

const NAV_LABEL_KEY: Record<string, keyof Dictionary["nav"]> = {
  "/": "overview",
  "/products": "products",
  "/categories": "categories",
  "/analytics": "analytics",
  "/team": "team",
  "/settings": "settings",
};

const GROUP_LABEL_KEY: Record<string, keyof Dictionary["nav"]> = {
  Overview: "groupOverview",
  Catalog: "groupCatalog",
  Workspace: "groupWorkspace",
};

export function AppSidebar({
  tenantName,
  email,
  role,
}: {
  tenantName: string;
  email: string;
  role: string;
}) {
  const pathname = usePathname();
  const { dict } = useT();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex items-baseline gap-1.5 overflow-hidden">
            <span className="text-base font-extrabold tracking-[0.14em] group-data-[collapsible=icon]:hidden">
              STEEZ
            </span>
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
          const items = NAV_ITEMS.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel>
                {dict.nav[GROUP_LABEL_KEY[group]]}
              </SidebarGroupLabel>
              <SidebarMenu>
                {items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const label = dict.nav[NAV_LABEL_KEY[item.href]] ?? item.label;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={label}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{label}</span>
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
        <UserMenu email={email} role={role} onSignOut={() => signOutAction()} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
