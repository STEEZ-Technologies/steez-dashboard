"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateResetToken, hashResetToken } from "@/lib/reset-token";
import { sendPasswordResetEmail } from "@/lib/auth-email";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation";

export type AuthenticateResult = {
  error?: string;
  totpRequired?: boolean;
};

export async function authenticate(
  _prevState: AuthenticateResult | undefined,
  formData: FormData,
): Promise<AuthenticateResult> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      code: formData.get("code") ?? undefined,
      rememberMe: formData.get("rememberMe") ?? undefined,
      redirectTo: "/products",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      const dict = await getDictionary();
      // TOTPRequired/TOTPInvalid are custom CredentialsSignin subclasses
      // (lib/auth.ts) — not in next-auth's built-in ErrorType union.
      switch (error.type as string) {
        case "TOTPRequired":
          return { totpRequired: true };
        case "TOTPInvalid":
          return { totpRequired: true, error: dict.auth.errInvalidCode };
        case "CredentialsSignin":
          return { error: dict.auth.errInvalidCredentials };
        default:
          return { error: dict.auth.errSomethingWrong };
      }
    }
    throw error;
  }
}

export type ForgotPasswordResult = { message?: string; error?: string };

/**
 * Always returns the same generic message whether or not the email exists —
 * otherwise this endpoint becomes a way to check who has an account.
 */
export async function requestPasswordReset(
  _prevState: ForgotPasswordResult | undefined,
  formData: FormData,
): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }
  const { email } = parsed.data;
  const GENERIC = { message: "If that email has an account, we've sent a reset link." };

  const withinLimit = await checkRateLimit(`reset-request:${email}`, {
    max: 3,
    windowMs: 15 * 60_000,
  });
  if (!withinLimit) return GENERIC;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return GENERIC;

  const { token, hash, expiresAt } = generateResetToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash: hash, resetTokenExpiresAt: expiresAt },
  });

  const resetUrl = `https://dashboard.steez.digital/reset-password?token=${token}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  return GENERIC;
}

export type ResetPasswordResult = { error?: string; success?: boolean };

export async function resetPassword(
  _prevState: ResetPasswordResult | undefined,
  formData: FormData,
): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { token, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { resetTokenHash: hashResetToken(token) },
  });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
  });

  return { success: true };
}
