import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "@/lib/cors";
import type { ArticleTopic, GuideBlockKind } from "@/app/generated/prisma/client";

// This route reads live data straight off the database; without this, Next
// statically renders the response once at build time and every subsequent
// request (in `next start`, on Vercel, etc.) serves that stale snapshot
// regardless of edits made in the dashboard afterward.
export const dynamic = "force-dynamic";

// Dashboard topic enum -> the site's own topic slugs (lib/articles.ts's TOPICS ids).
const TOPIC_SLUG: Record<ArticleTopic, string> = {
  REVERSE_OSMOSIS: "reverse-osmosis",
  CHOOSING: "choosing",
  MAINTENANCE: "maintenance",
  WATER_QUALITY: "water-quality",
  SUSTAINABILITY: "sustainability",
  COMPANY: "company",
};

// ArticleBlock reuses GuideBlockKind (P/H/LIST/TABLE); articles never use TABLE.
const BLOCK_KIND: Partial<Record<GuideBlockKind, "p" | "h2" | "ul">> = {
  P: "p",
  H: "h2",
  LIST: "ul",
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

  const articles = await prisma.article.findMany({
    where: { tenantId: tenant.id, published: true },
    orderBy: { sortOrder: "asc" },
    include: { blocks: { orderBy: { sortOrder: "asc" } } },
  });

  const payload = articles.map((a) => ({
    slug: a.slug,
    topic: TOPIC_SLUG[a.topic],
    published: (a.publishedAt ?? a.createdAt).toISOString().slice(0, 10),
    title: { en: a.titleEn, zh: a.titleZh },
    dek: { en: a.standfirstEn, zh: a.standfirstZh },
    metaTitle: { en: a.metaTitleEn, zh: a.metaTitleZh },
    keywords: a.keywordsEn,
    keywordsZh: a.keywordsZh.length > 0 ? a.keywordsZh : undefined,
    image: {
      src: a.imagePath ? getPublicUrl(a.imagePath) : null,
      alt: { en: a.imageAltEn, zh: a.imageAltZh },
    },
    body: a.blocks
      .map((b) => {
        const kind = BLOCK_KIND[b.kind];
        if (!kind) return null;
        if (kind === "ul") {
          return {
            kind,
            items: (b.itemsEn as string[] | null)?.map((en, i) => ({
              en,
              zh: (b.itemsZh as string[] | null)?.[i] ?? en,
            })) ?? [],
          };
        }
        return { kind, text: { en: b.textEn ?? "", zh: b.textZh ?? b.textEn ?? "" } };
      })
      .filter((b) => b !== null),
  }));

  return NextResponse.json(payload, { headers: CORS_HEADERS });
}
