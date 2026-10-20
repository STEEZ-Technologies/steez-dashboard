import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "@/lib/cors";
import { readLocalized } from "@/lib/localized";
import { readStats } from "@/lib/home-content";

// Live data, never a build-time snapshot — see articles/route.ts.
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** The homepage's opening claim and its figures. Each part is null until the
 *  client has saved one, which the site reads as "keep your own copy".
 *  Localized fields are { en, zh?, fr?, it?, es?, ja? }. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const { tenantSlug } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    return NextResponse.json({ error: "Unknown tenant" }, { status: 404, headers: CORS_HEADERS });
  }

  const home = await prisma.homeContent.findUnique({ where: { tenantId: tenant.id } });
  const stats = readStats(home?.stats);

  return NextResponse.json(
    {
      heroTitle: readLocalized(home?.heroTitle),
      heroSub: readLocalized(home?.heroSub),
      stats: stats.length > 0 ? stats : null,
    },
    { headers: CORS_HEADERS },
  );
}
