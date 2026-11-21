import "server-only";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import snapshot from "@/data/kawada-snapshot.json";

type Counts = { categories: number; products: number; primaryImages: number; galleries: number; events: number; articles: number; documents: number; homepage: number };

/** Import verified Kawada site content. Existing editorial text and media stay untouched. */
export async function importKawadaContent(tenantId: string): Promise<Counts> {
  const counts: Counts = { categories: 0, products: 0, primaryImages: 0, galleries: 0, events: 0, articles: 0, documents: 0, homepage: 0 };
  const categoryIds = new Map<string, string>();

  for (const [sortOrder, category] of snapshot.categories.entries()) {
    const existing = await prisma.category.findUnique({ where: { tenantId_slug: { tenantId, slug: category.id } } });
    const row = existing ?? await prisma.category.create({ data: { tenantId, slug: category.id, label: category.label, sortOrder } });
    categoryIds.set(category.id, row.id);
    if (!existing) counts.categories++;
  }

  for (const [sortOrder, product] of snapshot.products.entries()) {
    const existing = await prisma.product.findUnique({
      where: { tenantId_slug: { tenantId, slug: product.slug } },
      include: { _count: { select: { images: true } } },
    });
    const hero = product.photos[0];
    let productId: string;
    // Legacy browser uploads for this liner point at an unreachable OSS path.
    // Replace only this known broken gallery with its verified site photos.
    const repairLegacyLiner = product.slug === "feminine-150mm" &&
      Boolean(existing?.imagePath && !existing.imagePath.startsWith("/kawada/"));
    if (existing) {
      productId = existing.id;
      if ((!existing.imagePath || repairLegacyLiner) && hero) {
        await prisma.product.update({ where: { id: existing.id }, data: { imagePath: hero.src, imageAlt: hero.alt } });
        counts.primaryImages++;
      }
    } else {
      const created = await prisma.product.create({ data: {
        tenantId, slug: product.slug, model: product.name, name: product.name,
        categoryId: categoryIds.get(product.category), specs: product.specs as Prisma.InputJsonValue,
        imagePath: hero?.src ?? null, imageAlt: hero?.alt ?? null,
        published: product.published, sortOrder,
      } });
      productId = created.id;
      counts.products++;
      if (hero) counts.primaryImages++;
    }
    // Browser uploads already populated some galleries. Keep them as edited;
    // only seed gallery from real site photos when one has no images at all.
    if (repairLegacyLiner) await prisma.productImage.deleteMany({ where: { productId } });
    if (product.photos.length > 0 && (!existing || existing._count.images === 0 || repairLegacyLiner)) {
      await prisma.productImage.createMany({ data: product.photos.map((photo, index) => ({
        productId, imagePath: photo.src, alt: photo.alt, sortOrder: index,
      })) });
      counts.galleries += product.photos.length;
    }
  }

  for (const [sortOrder, event] of snapshot.events.entries()) {
    const existing = await prisma.newsEvent.findUnique({ where: { tenantId_slug: { tenantId, slug: event.slug } } });
    if (existing) continue;
    await prisma.newsEvent.create({ data: {
      tenantId, slug: event.slug, kind: "EXHIBITION", titleEn: event.title.en, titleZh: event.title.zh,
      placeEn: event.place.en || null, placeZh: event.place.zh || null, booth: event.booth,
      dating: "DAYS", startDate: new Date(`${event.start}T00:00:00.000Z`), endDate: new Date(`${event.end}T00:00:00.000Z`),
      imagePath: event.image, imageAltEn: event.alt?.en ?? null, imageAltZh: event.alt?.zh ?? null,
      sortOrder, published: true,
    } });
    counts.events++;
  }

  for (const [sortOrder, article] of snapshot.articles.entries()) {
    const existing = await prisma.article.findUnique({ where: { tenantId_slug: { tenantId, slug: article.slug } } });
    if (existing) continue;
    await prisma.article.create({ data: {
      tenantId, slug: article.slug, titleEn: article.title, standfirstEn: article.excerpt,
      topic: "COMPANY", imagePath: article.cover, imageAltEn: article.coverAlt,
      publishedAt: new Date(`${article.date}T00:00:00.000Z`), published: article.published, sortOrder,
      blocks: { create: [{ kind: "P", textEn: article.body, sortOrder: 0 }] },
    } });
    counts.articles++;
  }

  const catalogUrl = new URL(snapshot.catalog, "https://dashboard.steez.digital").toString();
  const document = await prisma.document.findFirst({ where: { tenantId, filePath: { in: [snapshot.catalog, catalogUrl] } } });
  if (document?.filePath === snapshot.catalog) {
    await prisma.document.update({ where: { id: document.id }, data: { filePath: catalogUrl } });
    counts.documents++;
  }
  if (!document) {
    await prisma.documentGroup.create({ data: {
      tenantId, section: "COMPANY", title: { en: "Kawada product catalogue" },
      documents: { create: [{ tenantId, label: { en: "Kawada product catalogue" }, filePath: catalogUrl, sortOrder: 0 }] },
    } });
    counts.documents++;
  }

  const home = await prisma.homeContent.findUnique({ where: { tenantId } });
  if (!home) {
    await prisma.homeContent.create({ data: {
      tenantId, heroTitle: { en: snapshot.home.heroTitle }, heroSub: { en: snapshot.home.heroSub },
      stats: snapshot.home.stats.map((stat) => ({
        figure: { en: stat.figure }, unit: stat.unit ? { en: stat.unit } : null,
        label: { en: stat.label }, body: null, href: stat.href,
      })),
    } });
    counts.homepage++;
  }
  return counts;
}
