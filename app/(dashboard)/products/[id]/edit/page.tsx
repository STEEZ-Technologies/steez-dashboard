import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Plus, BarChart3 } from "lucide-react";
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

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId } = await getTenantFromSession();
  const [product, categories] = await Promise.all([
    prisma.product.findFirst({ where: { id, tenantId } }),
    prisma.category.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  const [finishes, galleryRows] = await Promise.all([
    prisma.productFinish.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const gallery: GalleryImage[] = galleryRows.map((img) => ({
    id: img.id,
    url: getPublicUrl(img.imagePath),
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Edit product"
        description={product.model}
        action={
          <LinkButton variant="outline" size="sm" href={`/products/${product.id}/analytics`}>
            <BarChart3 /> View analytics
          </LinkButton>
        }
      />

      <ProductForm
        action={updateProduct.bind(null, product.id)}
        categories={categories}
        submitLabel="Save changes"
        defaultImageUrl={product.imagePath ? getPublicUrl(product.imagePath) : undefined}
        defaultValues={{
          slug: product.slug,
          model: product.model,
          name: product.name,
          description: product.description ?? "",
          imagePath: product.imagePath ?? "",
          categoryId: product.categoryId ?? "none",
          specsText: formatSpecsText(product.specs),
          featured: product.featured,
          published: product.published,
        }}
      />

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductImages productId={product.id} images={gallery} />
        </CardContent>
      </Card>

      <Card className="mt-6 max-w-2xl">
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
                      <Button type="submit" variant="ghost" size="icon-sm" disabled={index === 0}>
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
    </div>
  );
}
