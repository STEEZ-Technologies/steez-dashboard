import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { ArticleForm } from "@/components/news/ArticleForm";
import { ArticleBlocks, type ArticleBlockRow } from "@/components/news/article-blocks";
import { PageHeader } from "@/components/shell/page-header";
import { LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateArticle } from "../../actions";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId } = await getTenantFromSession();
  const article = await prisma.article.findFirst({ where: { id, tenantId } });
  if (!article) notFound();

  const blockRows = await prisma.articleBlock.findMany({
    where: { articleId: article.id },
    orderBy: { sortOrder: "asc" },
  });
  const blocks: ArticleBlockRow[] = blockRows.map((b) => ({
    id: b.id,
    kind: b.kind as ArticleBlockRow["kind"],
    textEn: b.textEn,
    textZh: b.textZh,
    itemsEn: (b.itemsEn as string[] | null) ?? null,
    itemsZh: (b.itemsZh as string[] | null) ?? null,
  }));

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Edit article" description={article.titleEn} />
      <LanguageScope>
        <LanguageTabs />
        <ArticleForm
          action={updateArticle.bind(null, article.id)}
          submitLabel="Save changes"
          defaultImageUrl={article.imagePath ? getPublicUrl(article.imagePath) : undefined}
          defaultValues={{
            slug: article.slug,
            titleEn: article.titleEn,
            titleZh: article.titleZh ?? "",
            standfirstEn: article.standfirstEn ?? "",
            standfirstZh: article.standfirstZh ?? "",
            metaTitleEn: article.metaTitleEn ?? "",
            metaTitleZh: article.metaTitleZh ?? "",
            keywordsEnText: article.keywordsEn.join(", "),
            keywordsZhText: article.keywordsZh.join(", "),
            imagePath: article.imagePath ?? "",
            imageAltEn: article.imageAltEn ?? "",
            imageAltZh: article.imageAltZh ?? "",
            topic: article.topic,
            published: article.published,
          }}
        />

        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle>Article text</CardTitle>
          </CardHeader>
          <CardContent>
            <ArticleBlocks articleId={article.id} blocks={blocks} />
          </CardContent>
        </Card>
      </LanguageScope>
    </div>
  );
}
