"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createTenantSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

/**
 * Provision a new client workspace and its first OWNER.
 *
 * This replaces self-service signup: clients never register themselves, STEEZ
 * creates the workspace and hands over credentials. Every action re-checks
 * requireSuperAdmin() rather than trusting that the UI was hidden.
 */
export async function createTenant(
  _prevState: string | undefined,
  formData: FormData,
) {
  const admin = await requireSuperAdmin();

  const parsed = createTenantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";
  const { name, slug, ownerEmail, ownerPassword } = parsed.data;

  const [slugTaken, emailTaken] = await Promise.all([
    prisma.tenant.findUnique({ where: { slug }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true } }),
  ]);
  if (slugTaken) return "That slug is already taken";
  if (emailTaken) return "A user with that email already exists";

  const passwordHash = await bcrypt.hash(ownerPassword, 10);
  await prisma.tenant.create({
    data: {
      slug,
      name,
      users: { create: { email: ownerEmail, passwordHash, role: "OWNER" } },
    },
  });

  // Audited against the STEEZ operator's own tenant — this is a platform
  // action, and the new workspace has no history of its own yet.
  await logAudit({
    action: "platform.tenant_create",
    entity: "tenant",
    detail: `${name} (${slug}) — owner ${ownerEmail} by ${admin.email}`,
  });

  revalidatePath("/admin");
  return undefined;
}

/** Support path: reset a client owner's password when they're locked out. */
export async function resetTenantOwnerPassword(userId: string, newPassword: string) {
  const admin = await requireSuperAdmin();
  if (newPassword.length < 8) return "Password must be at least 8 characters";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) return "User not found";

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logAudit({
    action: "platform.password_reset",
    entity: "user",
    entityId: user.id,
    detail: `${user.email} by ${admin.email}`,
  });

  revalidatePath("/admin");
  return undefined;
}
