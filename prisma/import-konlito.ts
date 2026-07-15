/**
 * One-off import: Konlito's real static catalog (~/Projects/konlito/lib/products.ts)
 * into the dashboard's Konlito tenant. Idempotent (upserts by slug).
 *
 * Per the Phase 5b scoping decision, only product *content* goes live —
 * category taxonomy stays a straightforward 1:1 mirror, and finish-swatch
 * strings (finishSwatch/product.finishes) are NOT imported as ProductFinish
 * rows: they're simple CSS-gradient tags with no real per-finish photo, a
 * different shape than ProductFinish (key/materialLabel/imagePath/accentHex).
 *
 * Images: Konlito's images are relative /public paths served from its own
 * live domain — stored here as absolute URLs (https://konlito.steez.digital/...),
 * which lib/oss.ts's getPublicUrl() now passes through unchanged.
 *
 * Run: DATABASE_URL="..." npx tsx prisma/import-konlito.ts
 */
import { prisma } from "../lib/db";
import {
  catalog,
  products,
  categoryOfProduct,
} from "../../konlito/lib/products";

const KONLITO_BASE = "https://konlito.steez.digital";

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "konlito" },
    update: {},
    create: { slug: "konlito", name: "Konlito" },
  });

  const categoryIdBySlug = new Map<string, string>();
  for (const [index, cat] of catalog.entries()) {
    const row = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: cat.slug } },
      update: { label: cat.title, description: cat.subtitle, sortOrder: index },
      create: {
        tenantId: tenant.id,
        slug: cat.slug,
        label: cat.title,
        description: cat.subtitle,
        sortOrder: index,
      },
    });
    categoryIdBySlug.set(cat.slug, row.id);
  }

  for (const [index, p] of products.entries()) {
    const cat = categoryOfProduct(p.id);
    const categoryId = cat ? categoryIdBySlug.get(cat.slug) : undefined;

    await prisma.product.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: p.id } },
      update: {
        model: p.model,
        name: p.name,
        description: p.description,
        imagePath: `${KONLITO_BASE}${p.image}`,
        specs: p.specs,
        featured: p.featured ?? false,
        categoryId: categoryId ?? null,
        sortOrder: index,
      },
      create: {
        tenantId: tenant.id,
        slug: p.id,
        model: p.model,
        name: p.name,
        description: p.description,
        imagePath: `${KONLITO_BASE}${p.image}`,
        specs: p.specs,
        featured: p.featured ?? false,
        categoryId: categoryId ?? null,
        sortOrder: index,
        published: true,
      },
    });
  }

  console.log(`Imported ${catalog.length} categories, ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
