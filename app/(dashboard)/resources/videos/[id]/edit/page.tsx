import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { youTubeUrl } from "@/lib/youtube";
import { VideoForm } from "@/components/resources/VideoForm";
import { PageHeader } from "@/components/shell/page-header";
import { LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { getDictionary, getLocale } from "@/lib/i18n";
import { updateVideo } from "../../actions";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId } = await getTenantFromSession();
  const video = await prisma.video.findFirst({ where: { id, tenantId } });
  if (!video) notFound();
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.videos;

  return (
    <div>
      <PageHeader title={t.editTitle} description={locale === "zh" && video.titleZh ? video.titleZh : video.titleEn} />
      <LanguageScope>
        <LanguageTabs />
        <VideoForm
          action={updateVideo.bind(null, video.id)}
          submitLabel={dict.actions.saveChanges}
          defaultValues={{
            video: youTubeUrl(video.youtubeId, video.short),
            short: video.short,
            kind: video.kind,
            titleEn: video.titleEn,
            titleZh: video.titleZh ?? "",
            published: video.published,
          }}
        />
      </LanguageScope>
    </div>
  );
}
