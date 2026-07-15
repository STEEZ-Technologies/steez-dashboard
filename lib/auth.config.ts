import type { NextAuthConfig } from "next-auth";

/**
 * DB-free auth config. Used directly by proxy.ts (which must never import
 * Prisma/bcrypt) and spread into the full config in lib/auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isPublicRoute = path === "/login" || path === "/signup";

      if (!isLoggedIn && !isPublicRoute) return false;
      if (isLoggedIn && isPublicRoute) {
        return Response.redirect(new URL("/", request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
