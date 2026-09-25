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

  const articles = await prisma.article.findMany({
    where: { tenantId: tenant.id, published: true },
    orderBy: { sortOrder: "asc" },
  });

  const payload = articles.map((a) => ({
    id: a.slug,
    title: { en: a.titleEn, zh: a.titleZh },
    standfirst: { en: a.standfirstEn, zh: a.standfirstZh },
    body: { en: a.bodyEn, zh: a.bodyZh },
    category: a.category,
    image: a.imagePath ? getPublicUrl(a.imagePath) : null,
    imageAlt: { en: a.imageAltEn, zh: a.imageAltZh },
    primaryKeyword: a.primaryKeyword,
    secondaryKeywords: a.secondaryKeywords,
    metaTitle: { en: a.metaTitleEn, zh: a.metaTitleZh },
    metaDescription: { en: a.metaDescriptionEn, zh: a.metaDescriptionZh },
    featured: a.featured,
    publishedAt: a.publishedAt,
  }));

  return NextResponse.json(payload, { headers: CORS_HEADERS });
}
