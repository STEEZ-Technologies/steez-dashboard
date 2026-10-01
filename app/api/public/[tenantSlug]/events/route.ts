import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "@/lib/cors";
import { eventDays, isUpcoming } from "@/lib/news-events";
import type { NewsEventKind } from "@/app/generated/prisma/client";

// Live data, never a build-time snapshot — see articles/route.ts.
export const dynamic = "force-dynamic";

// Dashboard kind enum -> the site's own kind ids (komibright-v2 lib/news.ts).
const KIND_SLUG: Record<NewsEventKind, string> = {
  EXHIBITION: "exhibition",
  VISIT: "visit",
  PRESS: "press",
  PRODUCT: "product",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** The site's "Company news" timeline, in the order the dashboard lists it.
 *  `upcoming` is worked out here from the dates, so the static site is right
 *  as of the day it was built. */
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

  const events = await prisma.newsEvent.findMany({
    where: { tenantId: tenant.id, published: true },
    orderBy: { sortOrder: "asc" },
  });

  const payload = events.map((e) => ({
    id: e.slug,
    kind: KIND_SLUG[e.kind],
    upcoming: isUpcoming(e),
    days: eventDays(e),
    year: e.dating === "YEAR" ? e.year : null,
    title: { en: e.titleEn, zh: e.titleZh },
    place: e.placeEn ? { en: e.placeEn, zh: e.placeZh } : null,
    booth: e.booth,
    photo: e.imagePath
      ? { src: getPublicUrl(e.imagePath), alt: { en: e.imageAltEn, zh: e.imageAltZh } }
      : null,
  }));

  return NextResponse.json(payload, { headers: CORS_HEADERS });
}
