"use client";

import { startTransition, useActionState, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LocalizedField } from "@/components/shared/localized-field";
import { useT } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/localized";

type L = Record<Locale, string>;

export type OfficeFormValues = {
  key: string;
  name: L;
  company: L;
  address: L;
  tel: string;
  fax: string;
  email: string;
  web: string;
  line: string;
  lat: string;
  lon: string;
  showMap: boolean;
  published: boolean;
};

export function OfficeForm({
  action,
  defaultValues: v,
  submitLabel,
  canEdit,
}: {
  action: (prevState: string | undefined, formData: FormData) => Promise<string | undefined>;
  defaultValues?: Partial<OfficeFormValues>;
  submitLabel: string;
  canEdit: boolean;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const { dict } = useT();
  const t = dict.company;
  const [showMap, setShowMap] = useState(v?.showMap ?? false);
  const [published, setPublished] = useState(v?.published ?? true);

  const text = (name: keyof OfficeFormValues, label: string, type = "text") => (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={(v?.[name] as string) ?? ""} />
    </div>
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
      <input type="hidden" name="showMap" value={showMap ? "on" : ""} />
      <input type="hidden" name="published" value={published ? "on" : ""} />

      <fieldset disabled={!canEdit}>
        <Card>
          <CardContent className="grid gap-5 p-6">
            <div className="grid gap-2">
              <Label htmlFor="key">{t.key}</Label>
              <Input id="key" name="key" defaultValue={v?.key} placeholder="shanghai" required />
              <p className="text-xs text-muted-foreground">{t.keyHelp}</p>
            </div>
            <LocalizedField name="name" label={t.name} defaults={v?.name} required />
            <LocalizedField name="company" label={t.officeCompany} defaults={v?.company} optional />
            <LocalizedField name="address" label={t.address} defaults={v?.address} required multiline />
            {text("tel", t.tel)}
            {text("fax", t.fax)}
            {text("email", t.officeEmail, "email")}
            {text("web", t.web)}
            {text("line", t.line)}
            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-4">
                {text("lat", t.lat)}
                {text("lon", t.lon)}
              </div>
              <p className="text-xs text-muted-foreground">{t.coordsHelp}</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={showMap} onCheckedChange={setShowMap} /> {t.showMap}
              </label>
              <p className="mt-1 text-xs text-muted-foreground">{t.showMapHelp}</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={published} onCheckedChange={setPublished} /> {t.published}
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {canEdit && (
              <div>
                <Button type="submit" disabled={pending}>
                  {pending ? t.saving : submitLabel}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </fieldset>
    </form>
  );
}
