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

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, published: true },
    orderBy: { sortOrder: "asc" },
    include: {
      category: true,
      finishes: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  const payload = products.map((product) => {
    // Gallery URLs, ordered; hero (imagePath) stays first for backward-compat.
    const galleryUrls = product.images.map((img) => getPublicUrl(img.imagePath));
    const heroUrl = product.imagePath ? getPublicUrl(product.imagePath) : null;
    const images = heroUrl
      ? [heroUrl, ...galleryUrls.filter((u) => u !== heroUrl)]
      : galleryUrls;

    return {
    id: product.slug,
    model: product.model,
    name: product.name,
    description: product.description,
    image: heroUrl ?? images[0] ?? null,
    images,
    specs: product.specs ?? {},
    featured: product.featured,
    category: product.category
      ? { slug: product.category.slug, label: product.category.label }
      : null,
    finishes: product.finishes.map((finish) => ({
      key: finish.key,
      material: finish.materialLabel,
      image: getPublicUrl(finish.imagePath),
      accent: finish.accentHex,
    })),
    };
  });

  return NextResponse.json(payload, { headers: CORS_HEADERS });
}
