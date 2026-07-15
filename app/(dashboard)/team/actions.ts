"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { userInviteSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { randomBytes } from "crypto";

export async function addTeamMember(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await getTenantFromSession();
  if (session.role !== "OWNER") return "Only owners can add members";

  const parsed = userInviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return "A user with that email already exists";

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const created = await prisma.user.create({
    data: {
      tenantId: session.tenantId,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });
  await logAudit({ action: "team.add", entity: "user", entityId: created.id, detail: parsed.data.email });

  revalidatePath("/team");
  return undefined;
}

export async function removeTeamMember(userId: string) {
  const session = await getTenantFromSession();
  if (session.role !== "OWNER") return;
  if (userId === session.id) return; // can't remove yourself

  const target = await prisma.user.findFirst({
    where: { id: userId, tenantId: session.tenantId },
    select: { email: true },
  });
  await prisma.user.deleteMany({
    where: { id: userId, tenantId: session.tenantId },
  });
  await logAudit({ action: "team.remove", entity: "user", entityId: userId, detail: target?.email });
  revalidatePath("/team");
}

export async function resetMemberPassword(userId: string, newPassword: string) {
  const session = await getTenantFromSession();
  if (session.role !== "OWNER") return "Only owners can reset passwords";
  if (newPassword.length < 8) return "Password must be at least 8 characters";

  const target = await prisma.user.findFirst({
    where: { id: userId, tenantId: session.tenantId },
  });
  if (!target) return "User not found";

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: target.id }, data: { passwordHash } });
  await logAudit({ action: "team.reset_password", entity: "user", entityId: userId, detail: target.email });
  revalidatePath("/team");
  return undefined;
}

/* ── Invite codes (gated signup) ──────────────────────────────── */

export async function createInviteCode() {
  const session = await getTenantFromSession();
  if (session.role !== "OWNER") return null;

  const code = randomBytes(6).toString("hex").toUpperCase(); // 12-char code
  await prisma.inviteCode.create({
    data: {
      code,
      createdByTenantId: session.tenantId,
      createdByEmail: session.email,
    },
  });
  await logAudit({ action: "invite.create", entity: "invite", detail: code });
  revalidatePath("/team");
  return code;
}

export async function revokeInviteCode(id: string) {
  const session = await getTenantFromSession();
  if (session.role !== "OWNER") return;
  // Only unused codes can be revoked.
  await prisma.inviteCode.deleteMany({ where: { id, usedAt: null } });
  revalidatePath("/team");
}
