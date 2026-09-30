"use server";

import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

type LeadStatus = "NEW" | "CONTACTED" | "QUOTED" | "WON" | "LOST" | "ARCHIVED";

const STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST", "ARCHIVED"];
const CLOSED: LeadStatus[] = ["WON", "LOST"];
const CURRENCIES = ["USD", "EUR", "CNY"];

export async function updateLeadStatus(id: string, status: string) {
  const session = await getTenantFromSession();
  if (!STATUSES.includes(status as LeadStatus)) return "Invalid status";

  // Tenant-scoped: a crafted id from another tenant matches zero rows.
  const result = await prisma.lead.updateMany({
    where: { id, tenantId: session.tenantId },
    data: {
      status: status as LeadStatus,
      // Stamp the close date for win-rate-over-time; reopening clears it.
      closedAt: CLOSED.includes(status as LeadStatus) ? new Date() : null,
    },
  });
  if (result.count === 0) return "Lead not found";

  await logAudit({
    action: "lead.status",
    entity: "lead",
    entityId: id,
    detail: status,
  });
  revalidatePath("/leads");
  revalidatePath("/", "layout"); // refreshes the sidebar NEW badge
  return undefined;
}

export async function updateLeadNotes(id: string, notes: string) {
  const session = await getTenantFromSession();

  const result = await prisma.lead.updateMany({
    where: { id, tenantId: session.tenantId },
    data: { notes: notes.trim() ? notes.trim().slice(0, 5000) : null },
  });
  if (result.count === 0) return "Lead not found";

  await logAudit({ action: "lead.notes", entity: "lead", entityId: id });
  revalidatePath("/leads");
  return undefined;
}

export async function updateLeadDeal(id: string, value: string, currency: string) {
  const session = await getTenantFromSession();

  const trimmed = value.replace(/[,\s]/g, "");
  const amount = trimmed === "" ? null : Number(trimmed);
  if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount >= 1e12)) {
    return "Enter a valid amount";
  }
  if (!CURRENCIES.includes(currency)) return "Invalid currency";

  const result = await prisma.lead.updateMany({
    where: { id, tenantId: session.tenantId },
    data: {
      dealValue: amount === null ? null : amount.toFixed(2),
      dealCurrency: amount === null ? null : currency,
    },
  });
  if (result.count === 0) return "Lead not found";

  await logAudit({
    action: "lead.deal",
    entity: "lead",
    entityId: id,
    detail: amount === null ? "cleared" : `${currency} ${amount.toFixed(2)}`,
  });
  revalidatePath("/leads");
  revalidatePath("/");
  return undefined;
}

export async function deleteLead(id: string) {
  const session = await getTenantFromSession();
  if (session.role !== "OWNER") return "Only owners can delete leads";

  const lead = await prisma.lead.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { email: true, name: true },
  });
  if (!lead) return "Lead not found";

  await prisma.lead.deleteMany({ where: { id, tenantId: session.tenantId } });
  await logAudit({
    action: "lead.delete",
    entity: "lead",
    entityId: id,
    detail: lead.email ?? lead.name ?? undefined,
  });
  revalidatePath("/leads");
  revalidatePath("/", "layout");
  return undefined;
}
