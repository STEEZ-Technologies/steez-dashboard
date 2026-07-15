import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Separate, DB-free NextAuth instance for Proxy only — must never import
// Prisma/bcrypt (lib/auth.ts) here. Turbopack bundles proxy.ts in isolation
// and the generated Prisma client's internal runtime import breaks in that
// bundle. Real tenant-scoped authorization still happens in lib/tenant.ts.
export const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
