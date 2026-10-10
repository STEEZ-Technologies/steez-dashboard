import { VideoForm } from "@/components/resources/VideoForm";
import { PageHeader } from "@/components/shell/page-header";
import { LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { getDictionary } from "@/lib/i18n";
import { createVideo } from "../actions";

export default async function NewVideoPage() {
  const t = (await getDictionary()).videos;
  return (
    <div>
      <PageHeader title={t.newTitle} />
      <LanguageScope>
        <LanguageTabs />
        <VideoForm action={createVideo} submitLabel={t.create} />
      </LanguageScope>
    </div>
  );
}
