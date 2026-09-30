import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getRecentAudit } from "@/lib/audit";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { getPublicUrl } from "@/lib/oss";
import { TwoFactorForm } from "@/components/settings/two-factor-form";
import { AuditList } from "@/components/settings/audit-list";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";
import { getRecentlyDeleted } from "@/lib/revisions";
import { DELETED_WINDOW_DAYS } from "@/lib/revisions-core";
import { RecentlyDeleted } from "@/components/shared/recently-deleted";

export default async function SettingsPage() {
  const session = await getTenantFromSession();
  const [tenant, audit, dict, currentUser, deleted] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    getRecentAudit(session.tenantId, 25),
    getDictionary(),
    prisma.user.findUniqueOrThrow({ where: { id: session.id }, select: { totpEnabled: true, name: true, avatarPath: true } }),
    getRecentlyDeleted(session.tenantId),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow={dict.pages.settings.eyebrow}
        title={dict.pages.settings.title}
        description={dict.settings.subtitle}
      />

      {/* grid-cols-1 (minmax(0,1fr)) — a bare `grid` sizes its column to the
          widest child's max-content, which pushed these cards off-screen on
          phones. */}
      <div className="grid grid-cols-1 gap-6">
        <ProfileForm
          name={currentUser.name ?? ""}
          avatarPath={currentUser.avatarPath ?? ""}
          avatarUrl={currentUser.avatarPath ? getPublicUrl(currentUser.avatarPath) : undefined}
        />

        <SettingsForm
          name={tenant.name}
          canManage={session.role === "OWNER"}
        />

        <ChangePasswordForm />

        <TwoFactorForm enabled={currentUser.totpEnabled} />

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

        <RecentlyDeleted
          days={DELETED_WINDOW_DAYS}
          rows={deleted.map((d) => ({
            id: d.id,
            entity: d.entity,
            label: d.label,
            who: d.userEmail,
            deletedAt: d.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
