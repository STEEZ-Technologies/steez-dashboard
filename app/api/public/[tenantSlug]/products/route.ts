import { readProductI18n, readTextI18n } from "@/lib/product-i18n";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "@/lib/cors";
import type {
  ProductKind,
  ProductUseCase,
  ProductWaterSource,
  ProductDispensing,
} from "@/app/generated/prisma/client";

// This route reads live data straight off the database; without this, Next
// statically renders the response once at build time and every subsequent
// request (in `next start`, on Vercel, etc.) serves that stale snapshot
// regardless of edits made in the dashboard afterward.
export const dynamic = "force-dynamic";

// Dashboard enums are uppercase; komibright-v2's lib/products.ts + lib/finder.ts
// types are lowercase.
const KIND: Record<ProductKind, string> = { MACHINE: "machine", ACCESSORY: "accessory" };
const USE_CASE: Record<ProductUseCase, string> = {
  KITCHEN: "kitchen",
  HOSPITALITY: "hospitality",
  LAB: "lab",
  MOBILE: "mobile",
};
const SOURCE: Record<ProductWaterSource, string> = { MAINS: "mains", OPEN: "open" };
const DISPENSING: Record<ProductDispensing, string> = {
  TANK: "tank",
  JAR: "jar",
  DIRECT: "direct",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const { tenantSlug } = await params;
  // `?all=1` also returns unpublished rows, marked `published: false`, so a
  // site that keeps its own copy of a product can hide it when the client
  // unpublishes it here. Without it the response is published rows only, as
  // Konlito's live fetch expects.
  const all = new URL(request.url).searchParams.get("all") === "1";

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    return NextResponse.json(
      { error: "Unknown tenant" },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, ...(all ? {} : { published: true }) },
    orderBy: { sortOrder: "asc" },
    include: {
      category: true,
      finishes: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      models3d: { orderBy: { sortOrder: "asc" } },
      contents: { orderBy: { sortOrder: "asc" } },
      applications: { orderBy: { sortOrder: "asc" } },
      fit: true,
    },
  });

  const payload = products.map((product) => {
    // Gallery URLs, ordered; hero (imagePath) stays first for backward-compat.
    const galleryUrls = product.images.map((img) => getPublicUrl(img.imagePath));
    const heroUrl = product.imagePath ? getPublicUrl(product.imagePath) : null;
    const images = heroUrl
      ? [heroUrl, ...galleryUrls.filter((u) => u !== heroUrl)]
      : galleryUrls;
    const models3d = product.models3d.map((m) => getPublicUrl(m.modelPath));

    return {
    id: product.slug,
    model: product.model,
    name: product.name,
    nameZh: product.nameZh,
    description: product.description,
    descriptionZh: product.descriptionZh,
    // French, Italian, Spanish and Japanese name/description, only the ones
    // actually written — { fr: { name, description }, … }.
    i18n: readProductI18n(product.i18n),
    kind: KIND[product.kind],
    useCases: product.useCases.map((u) => USE_CASE[u]),
    image: heroUrl ?? images[0] ?? null,
    images,
    models3d,
    specs: product.specs ?? {},
    featured: product.featured,
    published: product.published,
    category: product.category
      ? { slug: product.category.slug, label: product.category.label }
      : null,
    finishes: product.finishes.map((finish) => ({
      key: finish.key,
      material: finish.materialLabel,
      image: getPublicUrl(finish.imagePath),
      accent: finish.accentHex,
    })),
    contents: product.contents.map((c) => ({ en: c.textEn, zh: c.textZh, ...readTextI18n(c.textI18n) })),
    // Extra "Suited to" labels, shown beside the use cases.
    applications: product.applications.map((a) => ({
      en: a.textEn,
      zh: a.textZh,
      ...readTextI18n(a.textI18n),
    })),
    fit: product.fit
      ? {
          litresPerDay: product.fit.litresPerDay,
          minBar: product.fit.minBar,
          sources: product.fit.sources.map((s) => SOURCE[s]),
          dispensing: DISPENSING[product.fit.dispensing],
          powered: product.fit.powered,
        }
      : null,
    };
  });

  return NextResponse.json(payload, { headers: CORS_HEADERS });
}
