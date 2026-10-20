"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocalizedField } from "@/components/shared/localized-field";
import { DocumentUploadField } from "@/components/documents/DocumentUploadField";
import { useT } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/localized";

export function DocumentForm({
  action,
  groups,
  defaultValues,
  defaultUrl,
  submitLabel,
}: {
  action: (prevState: string | undefined, formData: FormData) => Promise<string | undefined>;
  groups: { id: string; title: string }[];
  defaultValues?: {
    groupId?: string;
    label?: Record<Locale, string>;
    filePath?: string;
    published?: boolean;
  };
  defaultUrl?: string;
  submitLabel: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const t = useT().dict.documents;
  const [groupId, setGroupId] = useState(defaultValues?.groupId ?? groups[0]?.id ?? "");
  const [published, setPublished] = useState(defaultValues?.published ?? true);
  const items = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g.title])), [groups]);

  return (
    <form
      className="max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="published" value={published ? "on" : ""} />
      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-2">
            <Label>{t.group}</Label>
            <Select value={groupId} onValueChange={(v) => v && setGroupId(v)} items={items}>
              <SelectTrigger className="w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <LocalizedField name="label" label={t.label} defaults={defaultValues?.label} required optional />
            <p className="text-xs text-muted-foreground">{t.labelHelp}</p>
          </div>
          <DocumentUploadField defaultValue={defaultValues?.filePath} defaultUrl={defaultUrl} />
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={published} onCheckedChange={setPublished} /> {t.published}
          </label>
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
