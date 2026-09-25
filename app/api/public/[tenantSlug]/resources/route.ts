import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "@/lib/cors";

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

  const guides = await prisma.guide.findMany({
    where: { tenantId: tenant.id, published: true },
    orderBy: { sortOrder: "asc" },
    include: { blocks: { orderBy: { sortOrder: "asc" } } },
  });

  const payload = guides.map((g) => ({
    id: g.slug,
    reader: g.reader,
    title: { en: g.titleEn, zh: g.titleZh },
    standfirst: { en: g.standfirstEn, zh: g.standfirstZh },
    minutes: g.minutes,
    image: g.imagePath ? getPublicUrl(g.imagePath) : null,
    imageAlt: { en: g.imageAltEn, zh: g.imageAltZh },
    body: g.blocks.map((b) =>
      b.kind === "TABLE"
        ? { kind: b.kind }
        : {
            kind: b.kind,
            text: { en: b.textEn, zh: b.textZh },
            items: { en: b.itemsEn ?? undefined, zh: b.itemsZh ?? undefined },
          },
    ),
  }));

  return NextResponse.json(payload, { headers: CORS_HEADERS });
}
