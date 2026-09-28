/**
 * One-off import: komibright-v2's real static content (products + buyer
 * guides) into the dashboard's komibright tenant. Idempotent (upserts by
 * slug). News is skipped — komibright-v2's /news is an intentional empty
 * state with zero articles written.
 *
 * kind: "machine" -> Category "Systems", "accessory" -> Category "Service Parts"
 * (matches /products/ page's own language on the site).
 *
 * Images: komibright-v2 is a static export with no live domain yet and no
 * OSS bucket configured. imagePath is left null here rather than guessing a
 * URL that doesn't resolve — a follow-up once hosting/OSS is decided.
 *
 * Run: npx tsx prisma/import-komibright.ts
 *
 * PRODUCTS/GUIDES are read via a subprocess (scripts/export-for-dashboard.ts
 * in komibright-v2, run from that repo's own directory) rather than a
 * direct import — resources.ts imports `@/lib/manualFacts`, and tsx
 * resolves `@/` against the entry point's tsconfig, which here is this
 * repo's, not komibright-v2's. Running the export in komibright-v2's own
 * tsx process is what makes the alias resolve.
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { prisma } from "../lib/db";
import type { Product } from "../../komibright-v2/lib/products";
import type { Block, Guide } from "../../komibright-v2/lib/resources";

const KOMIBRIGHT_DIR = path.resolve(__dirname, "../../komibright-v2");
const raw = execFileSync("npx", ["tsx", "scripts/export-for-dashboard.ts"], {
  cwd: KOMIBRIGHT_DIR,
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 50,
});
const { products: PRODUCTS, guides: GUIDES } = JSON.parse(raw) as {
  products: Product[];
  guides: Guide[];
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

    await prisma.product.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: p.id } },
      update: {
        model: p.model,
        name: p.name.en,
        description: p.blurb.en,
        specs,
        categoryId,
        sortOrder: index,
      },
      create: {
        tenantId: tenant.id,
        slug: p.id,
        model: p.model,
        name: p.name.en,
        description: p.blurb.en,
        specs,
        categoryId,
        sortOrder: index,
        published: true,
      },
    });
  }

  const readerMap: Record<string, "DISTRIBUTOR" | "CUSTOMER" | "BOTH"> = {
    distributor: "DISTRIBUTOR",
    customer: "CUSTOMER",
    both: "BOTH",
  };

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

  console.log(
    `Imported ${categories.length} categories, ${PRODUCTS.length} products, ${GUIDES.length} guides.`,
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
