/**
 * One-off import: komibright-v2's real static content (products, buyer
 * guides, articles and the two manual-fact groups) into the dashboard's
 * komibright tenant. Idempotent (upserts by slug/key).
 *
 * kind: "machine" -> Category "Systems", "accessory" -> Category "Service Parts"
 * (matches /products/ page's own language on the site).
 *
 * Images: product, guide and article photos are stored as absolute URLs on
 * komibright-v2's own hosting (KOMIBRIGHT_SITE_URL, default
 * https://komibright.steez.digital). getPublicUrl passes absolute URLs through
 * unchanged, as with Konlito's pre-OSS imports, so staff see the real photos
 * instead of empty frames; an upload through ImageUploadField later replaces
 * the URL with an OSS key. The site never takes product photos back from the
 * dashboard, and maps its own URLs back to local paths (lib/cmsImage.ts).
 *
 * Run: npx tsx prisma/import-komibright.ts
 *
 * Content is read via a subprocess (scripts/export-for-dashboard.ts in
 * komibright-v2, run from that repo's own directory) rather than a direct
 * import — resources.ts imports `@/lib/manualFacts`, and tsx resolves `@/`
 * against the entry point's tsconfig, which here is this repo's, not
 * komibright-v2's. Running the export in komibright-v2's own tsx process is
 * what makes the alias resolve.
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { prisma } from "../lib/db";
import type { Product } from "../../komibright-v2/lib/products";
import type { Block, Guide } from "../../komibright-v2/lib/resources";
import type { Article, Block as ArticleBlockShape } from "../../komibright-v2/lib/articles";
import type { Fact } from "../../komibright-v2/lib/manualFacts";
import type { Dispensing, Fit, Source } from "../../komibright-v2/lib/finder";
import type { ManualFactKey } from "../app/generated/prisma/client";

const KOMIBRIGHT_DIR = path.resolve(__dirname, "../../komibright-v2");
const raw = execFileSync("npx", ["tsx", "scripts/export-for-dashboard.ts"], {
  cwd: KOMIBRIGHT_DIR,
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 50,
});
const {
  products: PRODUCTS,
  guides: GUIDES,
  articles: ARTICLES,
  feedFacts: FEED_FACTS,
  serviceFacts: SERVICE_FACTS,
  fit: FIT,
  gallery: GALLERY,
} = JSON.parse(raw) as {
  products: Product[];
  guides: Guide[];
  articles: Article[];
  feedFacts: Fact[];
  serviceFacts: Fact[];
  fit: Record<string, Fit>;
  gallery: Record<string, { src: string; alt: string }[]>;
};

const SITE_URL = (process.env.KOMIBRIGHT_SITE_URL ?? "https://komibright.steez.digital").replace(/\/$/, "");
// Site paths are root-relative and some filenames carry spaces
// ("KB-C25R Plus.webp"), so encode each segment, not the whole path.
const siteUrl = (src: string | undefined) =>
  src ? SITE_URL + src.split("/").map(encodeURIComponent).join("/") : null;

const SOURCE_MAP: Record<Source, "MAINS" | "OPEN"> = { mains: "MAINS", open: "OPEN" };
const DISPENSING_MAP: Record<Dispensing, "TANK" | "JAR" | "DIRECT"> = {
  tank: "TANK",
  jar: "JAR",
  direct: "DIRECT",
};
const USE_CASE_MAP: Record<string, "KITCHEN" | "HOSPITALITY" | "LAB" | "MOBILE"> = {
  kitchen: "KITCHEN",
  hospitality: "HOSPITALITY",
  lab: "LAB",
  mobile: "MOBILE",
};
const TOPIC_MAP: Record<string, "REVERSE_OSMOSIS" | "CHOOSING" | "MAINTENANCE" | "WATER_QUALITY" | "SUSTAINABILITY" | "COMPANY"> = {
  "reverse-osmosis": "REVERSE_OSMOSIS",
  choosing: "CHOOSING",
  maintenance: "MAINTENANCE",
  "water-quality": "WATER_QUALITY",
  sustainability: "SUSTAINABILITY",
  company: "COMPANY",
};

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "komibright" },
    update: {},
    create: { slug: "komibright", name: "KomiBright" },
  });

  const categories = [
    { slug: "systems", label: "Systems", kind: "machine" as const },
    { slug: "service-parts", label: "Service Parts", kind: "accessory" as const },
  ];

  const categoryIdByKind = new Map<string, string>();
  for (const [index, cat] of categories.entries()) {
    const row = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: cat.slug } },
      update: { label: cat.label, sortOrder: index },
      create: {
        tenantId: tenant.id,
        slug: cat.slug,
        label: cat.label,
        sortOrder: index,
      },
    });
    categoryIdByKind.set(cat.kind, row.id);
  }

  for (const [index, p] of PRODUCTS.entries()) {
    const categoryId = categoryIdByKind.get(p.kind) ?? null;
    const specs = Object.fromEntries(p.specs);
    const kind = p.kind === "machine" ? ("MACHINE" as const) : ("ACCESSORY" as const);
    const useCases = p.useCases.map((u) => USE_CASE_MAP[u]).filter(Boolean);
    const shared = {
      model: p.model,
      name: p.name.en,
      nameZh: p.name.zh ?? null,
      description: p.blurb.en,
      descriptionZh: p.blurb.zh ?? null,
      specs,
      categoryId,
      sortOrder: index,
      kind,
      useCases,
      imagePath: siteUrl(p.image),
    };

    const product = await prisma.product.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: p.id } },
      update: shared,
      create: { tenantId: tenant.id, slug: p.id, ...shared, published: true },
    });

    // Box contents: idempotent by delete-and-recreate (no stable natural key).
    await prisma.productContent.deleteMany({ where: { productId: product.id } });
    if (p.contents?.length) {
      await prisma.productContent.createMany({
        data: p.contents.map((c, i) => ({
          productId: product.id,
          textEn: c.en,
          textZh: c.zh ?? null,
          sortOrder: i,
        })),
      });
    }

    // Gallery: the site's other photographs of this product, in its page's
    // order. Only rows pointing at the site are replaced, so a photo staff
    // uploaded through the dashboard survives a re-import.
    await prisma.productImage.deleteMany({
      where: { productId: product.id, imagePath: { startsWith: SITE_URL } },
    });
    const shots = GALLERY[p.id] ?? [];
    if (shots.length) {
      await prisma.productImage.createMany({
        data: shots.map((shot, i) => ({
          productId: product.id,
          imagePath: siteUrl(shot.src)!,
          alt: shot.alt,
          sortOrder: i,
        })),
      });
    }

    // Capacity/pressure: only for machines with a published FIT row.
    const fit = FIT[p.id];
    if (fit) {
      const fitData = {
        litresPerDay: fit.litresPerDay,
        minBar: fit.minBar,
        sources: fit.sources.map((s) => SOURCE_MAP[s]),
        dispensing: DISPENSING_MAP[fit.dispensing],
        powered: fit.powered,
      };
      await prisma.productFit.upsert({
        where: { productId: product.id },
        update: fitData,
        create: { productId: product.id, ...fitData },
      });
    }
  }

  const readerMap: Record<string, "DISTRIBUTOR" | "CUSTOMER" | "BOTH"> = {
    distributor: "DISTRIBUTOR",
    customer: "CUSTOMER",
    both: "BOTH",
  };

  const guideImages = (g: Guide) => ({
    imagePath: siteUrl(g.image?.src),
    imageDistributorPath: siteUrl(g.imageFor?.distributor?.src),
    imageDistributorAltEn: g.imageFor?.distributor?.alt.en ?? null,
    imageDistributorAltZh: g.imageFor?.distributor?.alt.zh ?? null,
    imageCustomerPath: siteUrl(g.imageFor?.customer?.src),
    imageCustomerAltEn: g.imageFor?.customer?.alt.en ?? null,
    imageCustomerAltZh: g.imageFor?.customer?.alt.zh ?? null,
  });

  for (const [index, g] of GUIDES.entries()) {
    const guide = await prisma.guide.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: g.id } },
      update: {
        reader: readerMap[g.reader],
        titleEn: g.title.en,
        titleZh: g.title.zh ?? null,
        standfirstEn: g.standfirst.en,
        standfirstZh: g.standfirst.zh ?? null,
        minutes: g.minutes,
        imageAltEn: g.image?.alt.en ?? null,
        imageAltZh: g.image?.alt.zh ?? null,
        ...guideImages(g),
        sortOrder: index,
      },
      create: {
        tenantId: tenant.id,
        slug: g.id,
        reader: readerMap[g.reader],
        titleEn: g.title.en,
        titleZh: g.title.zh ?? null,
        standfirstEn: g.standfirst.en,
        standfirstZh: g.standfirst.zh ?? null,
        minutes: g.minutes,
        imageAltEn: g.image?.alt.en ?? null,
        imageAltZh: g.image?.alt.zh ?? null,
        ...guideImages(g),
        sortOrder: index,
        published: true,
      },
    });

    // Blocks: idempotent by delete-and-recreate (no stable natural key per block).
    await prisma.guideBlock.deleteMany({ where: { guideId: guide.id } });

    const blockRows = (g.body as Block[]).map((b, i) => {
      const base = { guideId: guide.id, sortOrder: i };
      if (b.kind === "p") {
        return { ...base, kind: "P" as const, textEn: b.text.en, textZh: b.text.zh ?? null };
      }
      if (b.kind === "h") {
        return { ...base, kind: "H" as const, textEn: b.text.en, textZh: b.text.zh ?? null };
      }
      if (b.kind === "list") {
        return {
          ...base,
          kind: "LIST" as const,
          itemsEn: b.items.map((it) => it.en),
          itemsZh: b.items.map((it) => it.zh ?? it.en),
        };
      }
      return { ...base, kind: "TABLE" as const };
    });

    if (blockRows.length) {
      await prisma.guideBlock.createMany({ data: blockRows });
    }
  }

  for (const [index, a] of ARTICLES.entries()) {
    const topic = TOPIC_MAP[a.topic] ?? "COMPANY";
    const shared = {
      topic,
      titleEn: a.title.en,
      titleZh: a.title.zh ?? null,
      standfirstEn: a.dek.en,
      standfirstZh: a.dek.zh ?? null,
      metaTitleEn: a.metaTitle.en,
      metaTitleZh: a.metaTitle.zh ?? null,
      keywordsEn: a.keywords,
      keywordsZh: a.keywordsZh ?? [],
      imageAltEn: a.image.alt.en,
      imageAltZh: a.image.alt.zh ?? null,
      imagePath: siteUrl(a.image.src),
      sortOrder: index,
      publishedAt: new Date(a.published),
    };

    const article = await prisma.article.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: a.slug } },
      update: shared,
      create: { tenantId: tenant.id, slug: a.slug, ...shared, published: true },
    });

    // Blocks: idempotent by delete-and-recreate (no stable natural key per block).
    await prisma.articleBlock.deleteMany({ where: { articleId: article.id } });

    const blockRows = (a.body as ArticleBlockShape[]).map((b, i) => {
      const base = { articleId: article.id, sortOrder: i };
      if (b.kind === "p") {
        return { ...base, kind: "P" as const, textEn: b.text.en, textZh: b.text.zh ?? null };
      }
      if (b.kind === "h2") {
        return { ...base, kind: "H" as const, textEn: b.text.en, textZh: b.text.zh ?? null };
      }
      return {
        ...base,
        kind: "LIST" as const,
        itemsEn: b.items.map((it) => it.en),
        itemsZh: b.items.map((it) => it.zh ?? it.en),
      };
    });

    if (blockRows.length) {
      await prisma.articleBlock.createMany({ data: blockRows });
    }
  }

  const manualFacts: { key: ManualFactKey; fact: Fact }[] = [
    { key: "FEED_TDS", fact: FEED_FACTS[0] },
    { key: "FEED_MEMBRANE", fact: FEED_FACTS[1] },
    { key: "SERVICE_COMBO_FILTER", fact: SERVICE_FACTS[0] },
    { key: "SERVICE_MEMBRANE", fact: SERVICE_FACTS[1] },
  ];
  for (const { key, fact } of manualFacts) {
    if (!fact) continue;
    const data = {
      valueEn: fact.v.en,
      valueZh: fact.v.zh ?? null,
      noteEn: fact.note.en,
      noteZh: fact.note.zh ?? null,
    };
    await prisma.manualFact.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key } },
      update: data,
      create: { tenantId: tenant.id, key, ...data },
    });
  }

  console.log(
    `Imported ${categories.length} categories, ${PRODUCTS.length} products, ${GUIDES.length} guides, ${ARTICLES.length} articles, ${manualFacts.length} manual facts.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
