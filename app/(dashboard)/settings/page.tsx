import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getRecentAudit } from "@/lib/audit";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { AuditList } from "@/components/settings/audit-list";
import { Card, CardContent } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await getTenantFromSession();
  const [tenant, audit] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    getRecentAudit(session.tenantId, 25),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Workspace details, your account, and activity."
      />

      <div className="grid gap-6">
        <SettingsForm
          name={tenant.name}
          slug={tenant.slug}
          canManage={session.role === "OWNER"}
        />

        <ChangePasswordForm />

        <Card className="max-w-xl">
          <CardContent className="grid gap-1 p-6">
            <p className="eyebrow">Signed in as</p>
            <p className="text-sm font-medium">{session.email}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {session.role.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Activity log</h2>
          <AuditList items={audit} />
        </div>
      </div>
    </div>
  );
}
