"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createTenantSchema, tenantSiteSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { ACTING_TENANT_COOKIE } from "@/lib/tenant";

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

/**
 * Connect a workspace to its live site: the deploy hook Publish calls, and
 * the address "View live" links point at. STEEZ-only — clients never see
 * either field, since a wrong hook silently stops every publish.
 */
export async function updateTenantSite(
  tenantId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const admin = await requireSuperAdmin();

  const parsed = tenantSiteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true },
  });
  if (!tenant) return "Workspace not found";

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      deployHookUrl: parsed.data.deployHookUrl ?? null,
      siteUrl: parsed.data.siteUrl ?? null,
    },
  });
  // The hook URL is a credential of sorts — log that it changed, not its value.
  await logAudit({
    action: "platform.site_update",
    entity: "tenant",
    entityId: tenant.id,
    detail: `${tenant.name} (${tenant.slug}) by ${admin.email}`,
  });

  revalidatePath("/", "layout");
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

/**
 * Open a client workspace as STEEZ: the dashboard then reads and edits that
 * client's data, with every change audited under the operator's own email.
 * The opening itself is written to the client's log, so they can see when
 * STEEZ was in their workspace.
 */
export async function openWorkspace(tenantId: string) {
  const admin = await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });
  if (!tenant) return "Workspace not found";

  const jar = await cookies();
  if (tenant.id === admin.homeTenantId) {
    jar.delete(ACTING_TENANT_COOKIE);
    redirect("/admin");
  }

  jar.set(ACTING_TENANT_COOKIE, tenant.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 60 * 60, // a working session, not indefinitely
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      userEmail: admin.email ?? null,
      action: "platform.workspace_open",
      entity: "tenant",
      entityId: tenant.id,
      detail: `Opened by STEEZ (${admin.email})`,
    },
  });

  redirect("/");
}

/** Leave a client workspace and return to STEEZ's own. */
export async function exitWorkspace() {
  await requireSuperAdmin();
  (await cookies()).delete(ACTING_TENANT_COOKIE);
  redirect("/admin");
}
