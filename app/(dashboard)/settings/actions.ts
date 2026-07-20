"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { tenantSettingsSchema, passwordChangeSchema, totpConfirmSchema, totpDisableSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import {
  generateSecret,
  buildTotpUri,
  verifyTotpToken,
  generateRecoveryCodes,
  hashRecoveryCodes,
} from "@/lib/totp";

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
    data: {
      name: parsed.data.name,
      deployHookUrl: parsed.data.deployHookUrl ?? null,
    },
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

/**
 * Starts 2FA enrollment: generates a secret and stores it unconfirmed
 * (totpEnabled stays false until confirmTotpEnrollment verifies a code) —
 * an abandoned enrollment never locks the account into a broken state.
 */
export async function startTotpEnrollment(): Promise<
  { secret: string; uri: string } | { error: string }
> {
  const session = await getTenantFromSession();
  const secret = generateSecret();
  await prisma.user.update({
    where: { id: session.id },
    data: { totpSecret: secret, totpEnabled: false },
  });
  return { secret, uri: buildTotpUri(session.email, secret) };
}

export async function confirmTotpEnrollment(
  _prevState: { error?: string; recoveryCodes?: string[] } | undefined,
  formData: FormData,
): Promise<{ error?: string; recoveryCodes?: string[] }> {
  const session = await getTenantFromSession();

  const parsed = totpConfirmSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid code" };

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user?.totpSecret) return { error: "Start enrollment again" };

  if (!verifyTotpToken(user.totpSecret, parsed.data.code)) {
    return { error: "Invalid code" };
  }

  const recoveryCodes = generateRecoveryCodes();
  const recoveryHashes = await hashRecoveryCodes(recoveryCodes);

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true, recoveryCodes: recoveryHashes },
  });
  await logAudit({ action: "account.totp_enabled", entity: "user", entityId: user.id });

  revalidatePath("/settings");
  return { recoveryCodes };
}

export async function cancelTotpEnrollment() {
  const session = await getTenantFromSession();
  await prisma.user.update({
    where: { id: session.id },
    data: { totpSecret: null, totpEnabled: false },
  });
  revalidatePath("/settings");
}

export async function disableTotp(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await getTenantFromSession();

  const parsed = totpDisableSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return "User not found";

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return "Password is incorrect";

  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: null, totpEnabled: false, recoveryCodes: [] },
  });
  await logAudit({ action: "account.totp_disabled", entity: "user", entityId: user.id });

  revalidatePath("/settings");
  redirect("/settings?flash=" + encodeURIComponent("Two-factor authentication disabled"));
}
