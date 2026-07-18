"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/lib/auth";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

/**
 * Trigger a rebuild of the tenant's public static site via their host's
 * deploy hook, then mark everything as published.
 *
 * lastPublishedAt is only advanced when the hook actually accepts the
 * request — a failed publish must keep showing "pending" rather than
 * silently claiming the catalog is live.
 */
export async function publishToLive(): Promise<string | undefined> {
  const session = await getTenantFromSession();
  if (session.role !== "OWNER") return "Only owners can publish";

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { deployHookUrl: true },
  });
  if (!tenant.deployHookUrl) return "NOT_CONFIGURED";

  try {
    const res = await fetch(tenant.deployHookUrl, { method: "POST" });
    if (!res.ok) return `Deploy hook returned ${res.status}`;
  } catch {
    return "Could not reach the deploy hook";
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { lastPublishedAt: new Date() },
  });
  await logAudit({ action: "site.publish", entity: "tenant", entityId: session.tenantId });

  revalidatePath("/", "layout");
  return undefined;
}
