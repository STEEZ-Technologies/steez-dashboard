import { getTenantFromSession } from "@/lib/tenant";
import { siteIconUrls } from "@/lib/site-icon";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Suspense } from "react";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { Breadcrumbs } from "@/components/shell/breadcrumbs";
import { CommandPalette } from "@/components/shell/command-palette";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { FlashToast } from "@/components/shell/flash-toast";
import { getDictionary, getLocale } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/provider";
import { isSuperAdmin, PLATFORM_TENANT_SLUG } from "@/lib/super-admin";
import { ActingBanner } from "@/components/shell/acting-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getTenantFromSession();
  const [tenant, dict, locale, newLeadCount, profile] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: user.tenantId } }),
    getDictionary(),
    getLocale(),
    prisma.lead.count({ where: { tenantId: user.tenantId, status: "NEW" } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true, avatarPath: true } }),
  ]);

  return (
    <I18nProvider dict={dict} locale={locale}>
    <SidebarProvider>
      <AppSidebar
        tenantName={tenant.name}
        email={user.email ?? ""}
        displayName={profile?.name ?? null}
        avatarUrls={
          profile?.avatarPath
            ? [getPublicUrl(profile.avatarPath)]
            : // No picture uploaded: the workspace's own site icon. Each URL
              // is tried in turn; if none loads, the avatar shows initials.
              siteIconUrls(tenant)
        }
        role={user.role}
        newLeadCount={newLeadCount}
        isSuperAdmin={isSuperAdmin(user.email)}
        isPlatformWorkspace={tenant.slug === PLATFORM_TENANT_SLUG}
      />
      <SidebarInset className="min-w-0 bg-transparent">
        {/* Floating glass bar: inset from the edges so page content visibly
            slides under it and through the blur. */}
        <header className="glass sticky top-2 z-10 mx-2 mt-2 flex h-14 shrink-0 items-center gap-2 rounded-2xl px-3 md:mx-4">
          <SidebarTrigger />
          <Breadcrumbs />
          <div className="ml-auto flex items-center gap-2">
            <CommandPalette />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        {user.actingAs && <ActingBanner tenantName={tenant.name} />}
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto w-full min-w-0 max-w-[1600px]">{children}</div>
        </main>
        <Suspense>
          <FlashToast />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
    </I18nProvider>
  );
}
