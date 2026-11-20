/** Regenerate dashboard import snapshot from adjacent Kawada site checkout. */
import fs from "node:fs";
import path from "node:path";
import { CATEGORIES, PRODUCTS } from "../../kawada-v2/content/products";
import { NEXT_EXPO, PAST_EXPOS } from "../../kawada-v2/content/expos";
import { company } from "../../kawada-v2/content/company";

async function main() {
  const dashboardRoot = process.cwd();
  const siteRoot = path.resolve(dashboardRoot, "../kawada-v2");
  process.chdir(siteRoot);
  const { getArticles } = await import("../../kawada-v2/lib/news");
  const articles = getArticles();
  process.chdir(dashboardRoot);

  const active = new Set(PRODUCTS.map((product) => product.category));
  const snapshot = {
    categories: CATEGORIES.filter((category) => active.has(category.id)),
    products: PRODUCTS.map((product) => ({
      slug: product.slug, name: product.name, category: product.category,
      published: !product.placeholder,
      photos: product.placeholder ? [] : product.photos.map((photo) => ({ src: `/kawada${photo.src}`, alt: photo.alt })),
      specs: Object.fromEntries(product.specs
        .filter((spec) => spec.label !== "Core" && spec.label !== "Functional chip")
        .map((spec) => [spec.label, spec.value])),
    })),
    events: [
      ...(NEXT_EXPO ? [{ slug: "cidpex-2027", title: NEXT_EXPO.name, place: NEXT_EXPO.location, start: NEXT_EXPO.start, end: NEXT_EXPO.end, booth: NEXT_EXPO.chips[1]?.en ?? null, image: null, alt: null }] : []),
      ...PAST_EXPOS.map((expo) => ({ slug: expo.id, title: expo.name, place: expo.city ?? { en: "", zh: "" }, start: expo.start, end: expo.start, booth: null, image: expo.photos[0]?.src ? `/kawada${expo.photos[0].src}` : null, alt: expo.photos[0]?.alt ?? null })),
    ],
    articles: articles.map((article) => ({
      slug: article.slug, title: article.title, excerpt: article.excerpt,
      date: article.date, cover: `/kawada${article.coverImage.src}`,
      coverAlt: article.coverImage.alt, body: article.body,
      published: !article.placeholder,
    })),
    home: {
      heroTitle: "More care, more love",
      heroSub: "Sanitary pads, for your brand",
      stats: [
        { figure: String(company.founded), unit: null, label: "Founded", href: "/en/about/" },
        { figure: company.patents.total, unit: null, label: "Patents", href: "/en/innovation/" },
        { figure: String(company.employees), unit: null, label: "People", href: "/en/about/" },
        { figure: company.sampleDays, unit: "days", label: "Sample development", href: "/en/oem/" },
      ],
    },
    catalog: "/kawada/files/kawada-catalog.pdf",
  };
  fs.mkdirSync(path.join(dashboardRoot, "data"), { recursive: true });
  fs.writeFileSync(path.join(dashboardRoot, "data/kawada-snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log({ categories: snapshot.categories.length, products: snapshot.products.length, events: snapshot.events.length, articles: snapshot.articles.length });
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
