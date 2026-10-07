import { EventForm } from "@/components/news/EventForm";
import { PageHeader } from "@/components/shell/page-header";
import { LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { getDictionary } from "@/lib/i18n";
import { createNewsEvent } from "../actions";

export default async function NewEventPage() {
  const t = (await getDictionary()).newsEvents;
  return (
    <div>
      <PageHeader title={t.newTitle} />
      <LanguageScope>
        <LanguageTabs />
        <EventForm action={createNewsEvent} submitLabel={t.create} />
      </LanguageScope>
    </div>
  );
}
