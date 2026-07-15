"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { tenantSettingsSchema, passwordChangeSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function updateTenantSettings(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await getTenantFromSession();
  if (session.role !== "OWNER") return "Only owners can edit workspace settings";

  const parsed = tenantSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { name: parsed.data.name },
  });
  await logAudit({ action: "settings.update", entity: "tenant", entityId: session.tenantId, detail: parsed.data.name });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  redirect("/settings?flash=" + encodeURIComponent("Settings saved"));
}

export async function changePassword(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await getTenantFromSession();

  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return "User not found";

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return "Current password is incorrect";

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logAudit({ action: "account.password_change", entity: "user", entityId: user.id });

  revalidatePath("/settings");
  redirect("/settings?flash=" + encodeURIComponent("Password changed"));
}
