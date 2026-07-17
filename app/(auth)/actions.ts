"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/products",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const dict = await getDictionary();
      switch (error.type) {
        case "CredentialsSignin":
          return dict.auth.errInvalidCredentials;
        default:
          return dict.auth.errSomethingWrong;
      }
    }
    throw error;
  }
}
