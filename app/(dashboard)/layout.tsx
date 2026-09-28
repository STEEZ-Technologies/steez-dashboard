import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
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
  const [tenant, dict, locale, newLeadCount] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: user.tenantId } }),
    getDictionary(),
    getLocale(),
    prisma.lead.count({ where: { tenantId: user.tenantId, status: "NEW" } }),
  ]);

  return (
    <I18nProvider dict={dict} locale={locale}>
    <SidebarProvider>
      <AppSidebar
        tenantName={tenant.name}
        email={user.email ?? ""}
        role={user.role}
        newLeadCount={newLeadCount}
        isSuperAdmin={isSuperAdmin(user.email)}
        isPlatformWorkspace={tenant.slug === PLATFORM_TENANT_SLUG}
      />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <Breadcrumbs />
          <div className="ml-auto flex items-center gap-2">
            <CommandPalette />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        {user.actingAs && <ActingBanner tenantName={tenant.name} />}
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
        </main>
        <Suspense>
          <FlashToast />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
    </I18nProvider>
  );
}
