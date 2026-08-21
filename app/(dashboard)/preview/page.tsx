import Image from "next/image";
import { Eye, Box, ArrowLeft } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { getPendingChanges } from "@/lib/publish";
import { getPublicUrl } from "@/lib/oss";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shell/empty-state";
import { getDictionary } from "@/lib/i18n";

export default async function PreviewPage() {
  const { tenantId } = await getTenantFromSession();
  const dict = await getDictionary();
  const t = dict.publish;
  const { products, categories } = await getPendingChanges(tenantId);

  const nothingPending = products.length === 0 && categories.length === 0;

  return (
    <div>
      <PageHeader
        eyebrow={dict.pages.products.eyebrow}
        title={t.previewTitle}
        description={t.previewDesc}
        action={
          <LinkButton variant="outline" size="sm" href="/products">
            <ArrowLeft /> {t.backToProducts}
          </LinkButton>
        }
      />

      {nothingPending ? (
        <EmptyState icon={Eye} title={t.previewEmpty} />
      ) : (
        <div className="grid gap-8">
          {categories.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                {t.previewCategories}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="py-4">
                      <p className="font-medium">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.slug}</p>
                      {c.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {products.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                {t.previewProducts}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => {
                  const heroUrl = p.imagePath
                    ? getPublicUrl(p.imagePath)
                    : p.images[0]
                      ? getPublicUrl(p.images[0].imagePath)
                      : null;
                  return (
                    <Card key={p.id} className="overflow-hidden py-0">
                      <div className="relative aspect-square w-full bg-muted">
                        {heroUrl ? (
                          <Image
                            src={heroUrl}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            {t.previewNoImage}
                          </div>
                        )}
                      </div>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.model}</p>
                          </div>
                          {p.category && (
                            <Badge variant="secondary" className="shrink-0">
                              {p.category.label}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {p.images.length > 0 && (
                            <span>
                              {p.images.length === 1
                                ? t.previewImagesCount.replace("{n}", String(p.images.length))
                                : t.previewImagesCountOther.replace("{n}", String(p.images.length))}
                            </span>
                          )}
                          {p.models3d.length > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Box className="size-3.5" />
                              {p.models3d.length === 1
                                ? t.previewModelsCount.replace("{n}", String(p.models3d.length))
                                : t.previewModelsCountOther.replace("{n}", String(p.models3d.length))}
                            </span>
                          )}
                        </div>
                        {!p.published && (
                          <p className="mt-2 text-xs text-destructive">{t.previewUnpublished}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
