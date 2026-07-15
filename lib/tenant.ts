import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * DAL entry point — every authenticated page/action/route handler must call
 * this before touching tenant-scoped data. Never trust a tenantId from the
 * client; always derive it from here.
 *
 * The role/existence are re-read from the DB (not trusted from the JWT) so
 * that removing a user or changing their role takes effect immediately for
 * authorization, without waiting for the JWT to expire. Cached per request.
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

  return user;
});
