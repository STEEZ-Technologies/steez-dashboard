import { Plus } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getPublishState } from "@/lib/publish";
import { PublishBanner } from "@/components/shell/publish-banner";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { getDictionary } from "@/lib/i18n";
import { ResourcesTable, type GuideRow } from "@/components/resources/resources-table";
import { VideosTable, type VideoRow } from "@/components/resources/videos-table";
import { youTubeUrl } from "@/lib/youtube";

export default async function ResourcesPage() {
  const { tenantId, role } = await getTenantFromSession();
  const dict = await getDictionary();
  const publishState = await getPublishState(tenantId);
  const [guides, videos] = await Promise.all([
    prisma.guide.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.video.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const rows: GuideRow[] = guides.map((g) => ({
    id: g.id,
    titleEn: g.titleEn,
    reader: g.reader,
    published: g.published,
  }));

  const videoRows: VideoRow[] = videos.map((v) => ({
    id: v.id,
    titleEn: v.titleEn,
    titleZh: v.titleZh,
    kind: v.kind,
    short: v.short,
    url: youTubeUrl(v.youtubeId, v.short),
    published: v.published,
  }));

  return (
    <div>
      <PublishBanner
        pendingCount={publishState.pendingCount}
        configured={publishState.configured}
        canPublish={role === "OWNER"}
      />
      <PageHeader
        eyebrow={dict.pages.resources.eyebrow}
        title={dict.pages.resources.title}
        description={dict.resources.subtitle}
        action={
          <LinkButton href="/resources/new">
            <Plus /> {dict.actions.newGuide}
          </LinkButton>
        }
      />
      <ResourcesTable guides={rows} />

      <section className="mt-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{dict.videos.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {dict.videos.subtitle}
            </p>
          </div>
          <LinkButton href="/resources/videos/new" variant="outline" className="self-start sm:self-auto">
            <Plus /> {dict.actions.newVideo}
          </LinkButton>
        </div>
        <VideosTable videos={videoRows} />
      </section>
    </div>
  );
}
