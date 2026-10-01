import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { EventForm } from "@/components/news/EventForm";
import { PageHeader } from "@/components/shell/page-header";
import { LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { updateNewsEvent } from "../../actions";

const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId } = await getTenantFromSession();
  const event = await prisma.newsEvent.findFirst({ where: { id, tenantId } });
  if (!event) notFound();

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Edit event" description={event.titleEn} />
      <LanguageScope>
        <LanguageTabs />
        <EventForm
          action={updateNewsEvent.bind(null, event.id)}
          submitLabel="Save changes"
          defaultImageUrl={event.imagePath ? getPublicUrl(event.imagePath) : undefined}
          defaultValues={{
            slug: event.slug,
            kind: event.kind,
            titleEn: event.titleEn,
            titleZh: event.titleZh ?? "",
            placeEn: event.placeEn ?? "",
            placeZh: event.placeZh ?? "",
            booth: event.booth ?? "",
            dating: event.dating,
            startDate: isoDay(event.startDate),
            endDate: isoDay(event.endDate),
            year: event.year ? String(event.year) : "",
            imagePath: event.imagePath ?? "",
            imageAltEn: event.imageAltEn ?? "",
            imageAltZh: event.imageAltZh ?? "",
            published: event.published,
          }}
        />
      </LanguageScope>
    </div>
  );
}
