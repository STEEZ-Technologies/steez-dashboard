"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocalizedField } from "@/components/shared/localized-field";
import { useT } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/localized";

export type DocumentSectionValue = "CERTIFICATES" | "COMPANY";

export function DocumentGroupForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: string | undefined, formData: FormData) => Promise<string | undefined>;
  defaultValues?: { section: DocumentSectionValue; title: Record<Locale, string> };
  submitLabel: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const t = useT().dict.documents;
  const [section, setSection] = useState<DocumentSectionValue>(defaultValues?.section ?? "CERTIFICATES");
  const items = useMemo(
    () => ({ CERTIFICATES: t.sectionCertificates, COMPANY: t.sectionCompany }),
    [t],
  );

  return (
    <form
      className="max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <input type="hidden" name="section" value={section} />
      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-2">
            <Label>{t.section}</Label>
            <Select value={section} onValueChange={(v) => v && setSection(v as DocumentSectionValue)} items={items}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CERTIFICATES">{t.sectionCertificates}</SelectItem>
                <SelectItem value="COMPANY">{t.sectionCompany}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <LocalizedField name="title" label={t.groupTitle} defaults={defaultValues?.title} required />
            <p className="text-xs text-muted-foreground">{t.groupTitleHelp}</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? t.saving : submitLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
