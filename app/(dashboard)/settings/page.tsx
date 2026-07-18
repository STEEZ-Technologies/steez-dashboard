import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getRecentAudit } from "@/lib/audit";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { AuditList } from "@/components/settings/audit-list";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";

export default async function SettingsPage() {
  const session = await getTenantFromSession();
  const [tenant, audit, dict] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    getRecentAudit(session.tenantId, 25),
    getDictionary(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow={dict.pages.settings.eyebrow}
        title={dict.pages.settings.title}
        description={dict.settings.subtitle}
      />

      <div className="grid gap-6">
        <SettingsForm
          name={tenant.name}
          slug={tenant.slug}
          deployHookUrl={tenant.deployHookUrl}
          canManage={session.role === "OWNER"}
        />

        <ChangePasswordForm />

        <Card className="max-w-xl">
          <CardContent className="grid gap-1 p-6">
            <p className="eyebrow">{dict.settings.signedInAs}</p>
            <p className="text-sm font-medium">{session.email}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {session.role.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-lg font-semibold">{dict.settings.activityLog}</h2>
          <AuditList items={audit} dict={dict} />
        </div>
      </div>
    </div>
  );
}
