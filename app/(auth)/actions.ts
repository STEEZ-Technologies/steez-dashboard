"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";

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
