import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "@/lib/cors";
import type { ManualFactKey } from "@/app/generated/prisma/client";

// This route reads live data straight off the database; without this, Next
// statically renders the response once at build time and every subsequent
// request (in `next start`, on Vercel, etc.) serves that stale snapshot
// regardless of edits made in the dashboard afterward.
export const dynamic = "force-dynamic";

// Dashboard key -> the flat field name komibright-v2's lib/manualFacts.ts groups
// (FEED_FACTS: feedTds/feedMembrane, SERVICE_FACTS: serviceComboFilter/serviceMembrane).
const FIELD: Record<ManualFactKey, string> = {
  FEED_TDS: "feedTds",
  FEED_MEMBRANE: "feedMembrane",
  SERVICE_COMBO_FILTER: "serviceComboFilter",
  SERVICE_MEMBRANE: "serviceMembrane",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const { tenantSlug } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    return NextResponse.json(
      { error: "Unknown tenant" },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const facts = await prisma.manualFact.findMany({ where: { tenantId: tenant.id } });

  const payload: Record<string, { value: { en: string; zh: string | null }; note: { en: string | null; zh: string | null } }> = {};
  for (const f of facts) {
    payload[FIELD[f.key]] = {
      value: { en: f.valueEn, zh: f.valueZh },
      note: { en: f.noteEn, zh: f.noteZh },
    };
  }

  return NextResponse.json(payload, { headers: CORS_HEADERS });
}
