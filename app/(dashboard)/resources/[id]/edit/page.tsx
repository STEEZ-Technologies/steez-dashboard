import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { GuideForm } from "@/components/resources/GuideForm";
import { GuideBlocks, type GuideBlockRow } from "@/components/resources/guide-blocks";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";
import { updateGuide } from "../../actions";
import { HistoryCard } from "@/components/shared/HistoryCard";

function toStringArray(value: unknown): string[] | null {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : null;
}

export default async function EditGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId } = await getTenantFromSession();
  const guide = await prisma.guide.findFirst({ where: { id, tenantId } });
  if (!guide) notFound();
  const dict = await getDictionary();

  const blockRows = await prisma.guideBlock.findMany({
    where: { guideId: guide.id },
    orderBy: { sortOrder: "asc" },
  });
  const blocks: GuideBlockRow[] = blockRows.map((b) => ({
    id: b.id,
    kind: b.kind,
    textEn: b.textEn,
    textZh: b.textZh,
    itemsEn: toStringArray(b.itemsEn),
    itemsZh: toStringArray(b.itemsZh),
  }));

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Edit guide" description={guide.titleEn} />

      <GuideForm
        action={updateGuide.bind(null, guide.id)}
        submitLabel="Save changes"
        defaultImageUrl={guide.imagePath ? getPublicUrl(guide.imagePath) : undefined}
        defaultDistributorImageUrl={
          guide.imageDistributorPath ? getPublicUrl(guide.imageDistributorPath) : undefined
        }
        defaultCustomerImageUrl={
          guide.imageCustomerPath ? getPublicUrl(guide.imageCustomerPath) : undefined
        }
        defaultValues={{
          slug: guide.slug,
          reader: guide.reader,
          titleEn: guide.titleEn,
          titleZh: guide.titleZh ?? "",
          standfirstEn: guide.standfirstEn ?? "",
          standfirstZh: guide.standfirstZh ?? "",
          minutes: guide.minutes,
          imagePath: guide.imagePath ?? "",
          imageAltEn: guide.imageAltEn ?? "",
          imageAltZh: guide.imageAltZh ?? "",
          imageDistributorPath: guide.imageDistributorPath ?? "",
          imageDistributorAltEn: guide.imageDistributorAltEn ?? "",
          imageDistributorAltZh: guide.imageDistributorAltZh ?? "",
          imageCustomerPath: guide.imageCustomerPath ?? "",
          imageCustomerAltEn: guide.imageCustomerAltEn ?? "",
          imageCustomerAltZh: guide.imageCustomerAltZh ?? "",
          published: guide.published,
        }}
      />

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>{dict.resources.blocksTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <GuideBlocks guideId={guide.id} blocks={blocks} />
        </CardContent>
      </Card>

      <HistoryCard entity="guide" id={guide.id} />
    </div>
  );
}
