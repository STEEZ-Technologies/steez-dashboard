import "server-only";
import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";

// Platform-staff (STEEZ) access, kept deliberately OUTSIDE the database.
//
// Tenant provisioning can create workspaces and set owner passwords, so it
// must not be grantable through the app's own UI — otherwise a compromised
// tenant OWNER could escalate to platform admin. An env allowlist means
// escalation requires deploy access, not just a session.
function allowlist(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * STEEZ's own workspace. Platform staff need a User row, and every User
 * belongs to a Tenant — without this they had to live inside a client's
 * workspace (they were Konlito's owner), so "our dashboard" was Konlito's.
 * This tenant holds no catalog; it only exists to own STEEZ's logins and
 * the platform audit trail. Created by prisma/seed-steez.ts.
 */
export const PLATFORM_TENANT_SLUG = "steez";

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowlist().includes(email.toLowerCase());
}

/**
 * Gate for every platform-admin page and action. 404s rather than 403s so the
 * route's existence isn't advertised to tenant users.
 */
export async function requireSuperAdmin() {
  const session = await getTenantFromSession();
  if (!isSuperAdmin(session.email)) notFound();
  return session;
}
