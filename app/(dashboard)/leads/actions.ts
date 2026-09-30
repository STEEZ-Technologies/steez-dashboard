"use server";

import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hostOf } from "@/lib/analytics-helpers";
import { buildJourney, type RawStep } from "@/lib/lead-journey-helpers";

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

export type LeadJourney = {
  steps: {
    kind: RawStep["kind"];
    detail: string;
    productId: string | null;
    at: string; // ISO
    count: number;
  }[];
  visits: number;
  productsViewed: number;
  firstSeen: string | null;
  /** External source host of their first visit, e.g. "google.com". */
  source: string | null;
};

const JOURNEY_LOOKBACK_MS = 90 * 24 * 60 * 60_000;
const JOURNEY_ROWS = 200;

/** What this enquiry's visitor browsed before sending it — loaded when the
 *  row is opened rather than for every lead on the page. */
export async function getLeadJourney(id: string): Promise<LeadJourney | null> {
  const session = await getTenantFromSession();
  const lead = await prisma.lead.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { sessionId: true, createdAt: true, tenant: { select: { siteUrl: true } } },
  });
  if (!lead?.sessionId) return null;

  const range = {
    gte: new Date(lead.createdAt.getTime() - JOURNEY_LOOKBACK_MS),
    // The form's own page view can land a moment after the lead row.
    lte: new Date(lead.createdAt.getTime() + 60_000),
  };
  const where = { tenantId: session.tenantId, sessionId: lead.sessionId, createdAt: range };
  const [views, events] = await Promise.all([
    prisma.pageView.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: JOURNEY_ROWS,
      select: { path: true, referrer: true, createdAt: true },
    }),
    prisma.productEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: JOURNEY_ROWS,
      select: {
        eventType: true,
        productId: true,
        finishKey: true,
        createdAt: true,
        product: { select: { name: true, model: true } },
      },
    }),
  ]);

  const rows: RawStep[] = [
    ...views.map((v) => ({
      kind: "page_view" as const,
      key: v.path,
      detail: v.path,
      referrer: v.referrer,
      at: v.createdAt,
    })),
    ...events.map((e) => ({
      kind: (e.eventType === "CLICK" ? "product_click" : "product_view") as RawStep["kind"],
      key: e.productId ?? e.finishKey ?? "",
      detail: e.product
        ? `${e.product.name} · ${e.product.model}`
        : (e.finishKey ?? "—"),
      at: e.createdAt,
    })),
  ];
  const { steps, summary } = buildJourney(rows);

  // A referrer from the client's own site is internal navigation, not a source.
  const ownHost = lead.tenant.siteUrl ? hostOf(lead.tenant.siteUrl) : null;
  const sourceHost = summary.firstReferrer ? hostOf(summary.firstReferrer) : null;

  return {
    steps: steps.map((s) => ({
      kind: s.kind,
      detail: s.detail,
      productId: s.kind === "page_view" ? null : s.key || null,
      at: s.at.toISOString(),
      count: s.count,
    })),
    visits: summary.visits,
    productsViewed: summary.productsViewed,
    firstSeen: summary.firstSeen?.toISOString() ?? null,
    source: sourceHost && sourceHost !== "Direct" && sourceHost !== ownHost ? sourceHost : null,
  };
}
