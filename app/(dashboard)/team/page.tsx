import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shell/page-header";
import { TeamMembers, type Member } from "@/components/team/team-members";
import { getDictionary } from "@/lib/i18n";

export default async function TeamPage() {
  const session = await getTenantFromSession();
  const isOwner = session.role === "OWNER";
  const dict = await getDictionary();

  const users = await prisma.user.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "asc" },
  });

  const members: Member[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString().slice(0, 10),
    isSelf: u.id === session.id,
  }));

  return (
    <div>
      <PageHeader
        eyebrow={dict.pages.team.eyebrow}
        title={dict.pages.team.title}
        description={dict.team.subtitle}
      />
      <div className="grid gap-6">
        <TeamMembers members={members} canManage={isOwner} />
      </div>
    </div>
  );
}
