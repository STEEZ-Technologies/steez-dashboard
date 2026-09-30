import { GuideForm } from "@/components/resources/GuideForm";
import { PageHeader } from "@/components/shell/page-header";
import { LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { createGuide } from "../actions";

export default function NewGuidePage() {
  return (
    <div>
      <PageHeader eyebrow="Catalog" title="New guide" />
      <LanguageScope>
        <LanguageTabs />
        <GuideForm action={createGuide} submitLabel="Create guide" />
      </LanguageScope>
    </div>
  );
}
