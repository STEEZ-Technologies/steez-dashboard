import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "@/lib/cors";
import type { GuideReader, GuideBlockKind } from "@/app/generated/prisma/client";

// This route reads live data straight off the database; without this, Next
// statically renders the response once at build time and every subsequent
// request (in `next start`, on Vercel, etc.) serves that stale snapshot
// regardless of edits made in the dashboard afterward.
export const dynamic = "force-dynamic";

// Dashboard enums are uppercase; komibright-v2's lib/resources.ts types are lowercase.
const READER: Record<GuideReader, string> = {
  DISTRIBUTOR: "distributor",
  CUSTOMER: "customer",
  BOTH: "both",
};
const BLOCK_KIND: Record<GuideBlockKind, string> = {
  P: "p",
  H: "h",
  LIST: "list",
  TABLE: "table",
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

  const guides = await prisma.guide.findMany({
    where: { tenantId: tenant.id, published: true },
    orderBy: { sortOrder: "asc" },
    include: { blocks: { orderBy: { sortOrder: "asc" } } },
  });

  const payload = guides.map((g) => {
    const imageFor: Record<string, { src: string; alt: { en: string | null; zh: string | null } }> = {};
    if (g.imageDistributorPath) {
      imageFor.distributor = {
        src: getPublicUrl(g.imageDistributorPath),
        alt: { en: g.imageDistributorAltEn, zh: g.imageDistributorAltZh },
      };
    }
    if (g.imageCustomerPath) {
      imageFor.customer = {
        src: getPublicUrl(g.imageCustomerPath),
        alt: { en: g.imageCustomerAltEn, zh: g.imageCustomerAltZh },
      };
    }

    return {
    id: g.slug,
    reader: READER[g.reader],
    title: { en: g.titleEn, zh: g.titleZh },
    standfirst: { en: g.standfirstEn, zh: g.standfirstZh },
    minutes: g.minutes,
    image: g.imagePath ? getPublicUrl(g.imagePath) : null,
    imageAlt: { en: g.imageAltEn, zh: g.imageAltZh },
    imageFor: Object.keys(imageFor).length > 0 ? imageFor : undefined,
    body: g.blocks.map((b) => {
      if (b.kind === "TABLE") return { kind: BLOCK_KIND[b.kind] };
      if (b.kind === "LIST") {
        const itemsEn = (b.itemsEn as string[] | null) ?? [];
        const itemsZh = b.itemsZh as string[] | null;
        return {
          kind: BLOCK_KIND[b.kind],
          items: itemsEn.map((en, i) => ({ en, zh: itemsZh?.[i] ?? null })),
        };
      }
      return { kind: BLOCK_KIND[b.kind], text: { en: b.textEn, zh: b.textZh } };
    }),
    };
  });

  return NextResponse.json(payload, { headers: CORS_HEADERS });
}
