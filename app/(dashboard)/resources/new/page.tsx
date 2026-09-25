import { GuideForm } from "@/components/resources/GuideForm";
import { PageHeader } from "@/components/shell/page-header";
import { createGuide } from "../actions";

export default function NewGuidePage() {
  return (
    <div>
      <PageHeader eyebrow="Catalog" title="New guide" />
      <GuideForm action={createGuide} submitLabel="Create guide" />
    </div>
  );
}
