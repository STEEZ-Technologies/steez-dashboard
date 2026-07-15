import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shell/page-header";
import { TeamMembers, type Member } from "@/components/team/team-members";
import { InviteCodes, type InviteCodeRow } from "@/components/team/invite-codes";

export default async function TeamPage() {
  const session = await getTenantFromSession();
  const isOwner = session.role === "OWNER";

  const [users, codes] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "asc" },
    }),
    isOwner
      ? prisma.inviteCode.findMany({
          where: { createdByTenantId: session.tenantId },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const members: Member[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString().slice(0, 10),
    isSelf: u.id === session.id,
  }));

  const codeRows: InviteCodeRow[] = codes.map((c) => ({
    id: c.id,
    code: c.code,
    used: c.usedAt != null,
    usedByEmail: c.usedByEmail,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Team"
        description="People who can sign in and manage this catalog."
      />
      <div className="grid gap-6">
        <TeamMembers members={members} canManage={isOwner} />
        {isOwner && <InviteCodes codes={codeRows} />}
      </div>
    </div>
  );
}
