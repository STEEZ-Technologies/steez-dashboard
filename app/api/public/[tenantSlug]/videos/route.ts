import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "@/lib/cors";
import type { VideoKind } from "@/app/generated/prisma/client";

// Live data, never a build-time snapshot — see articles/route.ts.
export const dynamic = "force-dynamic";

// Dashboard kind enum -> the site's own kind ids (komibright-v2 lib/videos.ts).
const KIND_SLUG: Record<VideoKind, string> = {
  PRESS: "press",
  DISTRIBUTOR: "distributor",
  TRAINING: "training",
  PRODUCT: "product",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** The site's Videos shelf, in the order the dashboard lists it. `id` is the
 *  YouTube id — the site links out to YouTube and serves its own poster. */
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

  const videos = await prisma.video.findMany({
    where: { tenantId: tenant.id, published: true },
    orderBy: { sortOrder: "asc" },
  });

  const payload = videos.map((v) => ({
    id: v.youtubeId,
    short: v.short,
    kind: KIND_SLUG[v.kind],
    title: { en: v.titleEn, zh: v.titleZh },
  }));

  return NextResponse.json(payload, { headers: CORS_HEADERS });
}
