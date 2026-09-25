import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { ArticleForm } from "@/components/news/ArticleForm";
import { PageHeader } from "@/components/shell/page-header";
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

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Edit article" description={article.titleEn} />
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
          bodyEn: article.bodyEn ?? "",
          bodyZh: article.bodyZh ?? "",
          metaTitleEn: article.metaTitleEn ?? "",
          metaTitleZh: article.metaTitleZh ?? "",
          metaDescriptionEn: article.metaDescriptionEn ?? "",
          metaDescriptionZh: article.metaDescriptionZh ?? "",
          primaryKeyword: article.primaryKeyword ?? "",
          secondaryKeywords: article.secondaryKeywords ?? "",
          imagePath: article.imagePath ?? "",
          imageAltEn: article.imageAltEn ?? "",
          imageAltZh: article.imageAltZh ?? "",
          category: article.category,
          featured: article.featured,
          published: article.published,
        }}
      />
    </div>
  );
}
