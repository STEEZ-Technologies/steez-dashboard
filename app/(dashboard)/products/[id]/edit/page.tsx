import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Plus, BarChart3, ExternalLink } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/products/ProductForm";
import { formatSpecsText } from "@/lib/specs";
import { getPublicUrl } from "@/lib/oss";
import { updateProduct } from "../../actions";
import { deleteFinish, moveFinish } from "../finishes/actions";
import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImages, type GalleryImage } from "@/components/products/product-images";
import { ProductModels3D, type ProductModel } from "@/components/products/product-models-3d";
import { ProductContent, type ProductContentRow } from "@/components/products/product-content";
import { getDictionary } from "@/lib/i18n";
import { HistoryCard } from "@/components/shared/HistoryCard";
import { LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { ProductTabs, ProductTabPanel } from "@/components/products/product-tabs";

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
  const dict = await getDictionary();
  // KomiBright's site never reads the dashboard's product photo, the Featured
  // flag or finishes (a Konlito concept) — so its editors don't see them.
  const lean = tenant.slug === "komibright";

  const [finishes, galleryRows, model3dRows, contentRows] = await Promise.all([
    prisma.productFinish.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: "asc" },
    }),
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

            {!lean && (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Finishes</CardTitle>
                  <LinkButton
                    variant="outline"
                    size="sm"
                    href={`/products/${product.id}/finishes/new`}
                  >
                    <Plus /> Add finish
                  </LinkButton>
                </CardHeader>
                <CardContent>
                  {finishes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No finishes yet.</p>
                  ) : (
                    <ul className="divide-y">
                      {finishes.map((finish, index) => (
                        <li key={finish.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                          <Image
                            src={getPublicUrl(finish.imagePath)}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 rounded-md border object-cover"
                            unoptimized
                          />
                          <span
                            className="size-4 rounded-full border"
                            style={{ backgroundColor: finish.accentHex }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{finish.materialLabel}</p>
                            <p className="text-xs text-muted-foreground">{finish.key}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <form action={moveFinish}>
                              <input type="hidden" name="productId" value={product.id} />
                              <input type="hidden" name="finishId" value={finish.id} />
                              <input type="hidden" name="direction" value="up" />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon-sm"
                                disabled={index === 0}
                                aria-label={dict.actions.moveUp}
                              >
                                ↑
                              </Button>
                            </form>
                            <form action={moveFinish}>
                              <input type="hidden" name="productId" value={product.id} />
                              <input type="hidden" name="finishId" value={finish.id} />
                              <input type="hidden" name="direction" value="down" />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon-sm"
                                disabled={index === finishes.length - 1}
                                aria-label={dict.actions.moveDown}
                              >
                                ↓
                              </Button>
                            </form>
                            <LinkButton variant="ghost" size="sm" href={`/products/${product.id}/finishes/${finish.id}/edit`}>
                              Edit
                            </LinkButton>
                            <form action={deleteFinish}>
                              <input type="hidden" name="productId" value={product.id} />
                              <input type="hidden" name="finishId" value={finish.id} />
                              <ConfirmSubmitButton
                                confirmMessage={`Delete finish "${finish.materialLabel}"?`}
                                className="rounded-md px-2 py-1 text-sm font-medium text-destructive hover:bg-destructive/10"
                              >
                                Delete
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          </ProductTabPanel>
        </ProductTabs>
      </LanguageScope>

      <HistoryCard entity="product" id={product.id} />
    </div>
  );
}
