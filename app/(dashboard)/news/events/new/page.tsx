import { EventForm } from "@/components/news/EventForm";
import { PageHeader } from "@/components/shell/page-header";
import { LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { createNewsEvent } from "../actions";

export default function NewEventPage() {
  return (
    <div>
      <PageHeader eyebrow="Catalog" title="New event" />
      <LanguageScope>
        <LanguageTabs />
        <EventForm action={createNewsEvent} submitLabel="Create event" />
      </LanguageScope>
    </div>
  );
}
