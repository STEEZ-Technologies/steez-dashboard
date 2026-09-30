import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, ExternalLink } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/products/ProductForm";
import { formatSpecsText } from "@/lib/specs";
import { getPublicUrl } from "@/lib/oss";
import { updateProduct } from "../../actions";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImages, type GalleryImage } from "@/components/products/product-images";
import { ProductModels3D, type ProductModel } from "@/components/products/product-models-3d";
import { ProductContent, type ProductContentRow } from "@/components/products/product-content";
import { HistoryCard } from "@/components/shared/HistoryCard";
import { LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { ProductTabs, ProductTabPanel } from "@/components/products/product-tabs";
import { CompletenessBar } from "@/components/products/completeness-bar";
import { productCompleteness } from "@/lib/completeness";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const { tenantId } = await getTenantFromSession();
  const [product, categories, tenant] = await Promise.all([
    prisma.product.findFirst({ where: { id, tenantId }, include: { fit: true } }),
    prisma.category.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { siteUrl: true, slug: true } }),
  ]);
  if (!product) notFound();
  // KomiBright's site never reads the dashboard's product photo or the
  // Featured flag — so its editors don't see them.
  const lean = tenant.slug === "komibright";

  const [galleryRows, model3dRows, contentRows] = await Promise.all([
    prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.productModel3D.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.productContent.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const gallery: GalleryImage[] = galleryRows.map((img) => ({
    id: img.id,
    url: getPublicUrl(img.imagePath),
  }));
  const models3d: ProductModel[] = model3dRows.map((m) => ({
    id: m.id,
    url: getPublicUrl(m.modelPath),
  }));
  const completeness = productCompleteness(
    {
      nameZh: product.nameZh,
      description: product.description,
      descriptionZh: product.descriptionZh,
      imagePath: product.imagePath,
      galleryCount: galleryRows.length,
      categoryId: product.categoryId,
      specs: product.specs,
    },
    { lean },
  );
  const contents: ProductContentRow[] = contentRows.map((c) => ({
    id: c.id,
    textEn: c.textEn,
    textZh: c.textZh,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Edit product"
        description={product.model}
        action={
          <div className="flex items-center gap-2">
            {tenant.siteUrl && (
              <LinkButton
                variant="outline"
                size="sm"
                href={`${tenant.siteUrl}/products/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink /> Preview on site
              </LinkButton>
            )}
            <LinkButton variant="outline" size="sm" href={`/products/${product.id}/analytics`}>
              <BarChart3 /> View analytics
            </LinkButton>
          </div>
        }
      />

      <LanguageScope>
        <LanguageTabs />
        <ProductTabs initialTab={tab}>
          <CompletenessBar completeness={completeness} />
          <ProductForm
            action={updateProduct.bind(null, product.id)}
            categories={categories}
            submitLabel="Save changes"
            lean={lean}
            defaultImageUrl={product.imagePath ? getPublicUrl(product.imagePath) : undefined}
            defaultValues={{
              slug: product.slug,
              model: product.model,
              name: product.name,
              nameZh: product.nameZh ?? "",
              description: product.description ?? "",
              descriptionZh: product.descriptionZh ?? "",
              imagePath: product.imagePath ?? "",
              categoryId: product.categoryId ?? "none",
              specsText: formatSpecsText(product.specs),
              kind: product.kind,
              useCases: product.useCases,
              featured: product.featured,
              published: product.published,
              fit: product.fit
                ? {
                    litresPerDay: product.fit.litresPerDay,
                    minBar: product.fit.minBar,
                    sources: product.fit.sources,
                    dispensing: product.fit.dispensing,
                    powered: product.fit.powered,
                  }
                : null,
            }}
          />

          <ProductTabPanel tab="specs">
            <Card className="mt-6 max-w-2xl">
              <CardHeader>
                <CardTitle>Box contents</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductContent productId={product.id} items={contents} />
              </CardContent>
            </Card>
          </ProductTabPanel>

          <ProductTabPanel tab="media" className="grid max-w-2xl gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductImages productId={product.id} images={gallery} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3D models</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductModels3D productId={product.id} models={models3d} />
              </CardContent>
            </Card>

          </ProductTabPanel>
        </ProductTabs>
      </LanguageScope>

      <HistoryCard entity="product" id={product.id} />
    </div>
  );
}
