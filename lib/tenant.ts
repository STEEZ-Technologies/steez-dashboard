import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/super-admin";

/**
 * Cookie holding the client workspace a STEEZ operator has opened from
 * /admin. Only honoured for SUPER_ADMIN_EMAILS — for anyone else it is
 * ignored, so setting it by hand grants nothing.
 */
export const ACTING_TENANT_COOKIE = "steez-acting-tenant";

/**
 * DAL entry point — every authenticated page/action/route handler must call
 * this before touching tenant-scoped data. Never trust a tenantId from the
 * client; always derive it from here.
 *
 * The role/existence are re-read from the DB (not trusted from the JWT) so
 * that removing a user or changing their role takes effect immediately for
 * authorization, without waiting for the JWT to expire. Cached per request.
 *
 * When a STEEZ operator has opened a client workspace, tenantId is that
 * client's and role is OWNER; id/email stay the operator's own, so the audit
 * log records STEEZ as the actor. homeTenantId is always the user's own.
 */
export const getTenantFromSession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, tenantId: true, email: true, role: true },
  });

  // User was removed since the token was issued.
  if (!user) {
    redirect("/login");
  }

  const base = { ...user, homeTenantId: user.tenantId, actingAs: false };
  if (!isSuperAdmin(user.email)) return base;

  const acting = (await cookies()).get(ACTING_TENANT_COOKIE)?.value;
  if (!acting || acting === user.tenantId) return base;

  // Stale cookie (workspace deleted) falls back to the operator's own.
  const client = await prisma.tenant.findUnique({
    where: { id: acting },
    select: { id: true },
  });
  if (!client) return base;

  return { ...base, tenantId: client.id, role: "OWNER" as const, actingAs: true };
});
