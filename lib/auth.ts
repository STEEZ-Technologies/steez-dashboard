import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTotpToken, matchRecoveryCode } from "@/lib/totp";

// Thrown from authorize() when the password is correct but a 2FA code is
// still needed — the login form catches this by `error.type` and reveals
// the code field, instead of treating it as invalid credentials.
export class TOTPRequiredError extends CredentialsSignin {
  static type = "TOTPRequired";
}
export class TOTPInvalidError extends CredentialsSignin {
  static type = "TOTPInvalid";
}

// Unchecked "Keep me signed in" still gets a real session — just a short one,
// forced by the jwt callback below rather than by cookie Max-Age (NextAuth's
// JWT cookie duration is fixed per-deployment, not per-login).
const SHORT_SESSION_SECONDS = 24 * 60 * 60;

function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA code", type: "text" },
        rememberMe: { label: "Keep me signed in", type: "text" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const code = (credentials?.code as string | undefined)?.trim();
        // Native checkbox: "on" when checked, absent (undefined) when not.
        const rememberMe = credentials?.rememberMe === "on";
        if (!email || !password) return null;

        // Brute-force guard: 5 attempts / 5min per email, 20 / 5min per IP
        // (catches both a targeted attack and a spray across many emails).
        const ip = clientIp(request);
        const [emailOk, ipOk] = await Promise.all([
          checkRateLimit(`login:email:${email}`, { max: 5, windowMs: 5 * 60_000 }),
          checkRateLimit(`login:ip:${ip}`, { max: 20, windowMs: 5 * 60_000 }),
        ]);
        if (!emailOk || !ipOk) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (user.totpEnabled) {
          if (!code) throw new TOTPRequiredError();

          if (verifyTotpToken(user.totpSecret!, code)) {
            // valid TOTP — fall through to success below
          } else {
            const idx = await matchRecoveryCode(code, user.recoveryCodes);
            if (idx === -1) throw new TOTPInvalidError();
            // Recovery codes are single-use — consume it now.
            const remaining = user.recoveryCodes.filter((_, i) => i !== idx);
            await prisma.user.update({
              where: { id: user.id },
              data: { recoveryCodes: remaining },
            });
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role,
          rememberMe,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.tenantId = user.tenantId;
        token.role = user.role;
        token.rememberMe = user.rememberMe ?? false;
        return token;
      }

      // Not a fresh sign-in — enforce the short session for anyone who
      // didn't check "Keep me signed in" (token.iat is set by NextAuth).
      if (!token.rememberMe && typeof token.iat === "number") {
        const age = Date.now() / 1000 - token.iat;
        if (age > SHORT_SESSION_SECONDS) return null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.tenantId = token.tenantId;
      session.user.role = token.role;
      return session;
    },
  },
});
