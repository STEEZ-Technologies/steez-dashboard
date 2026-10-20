"use client";

import { startTransition, useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LocalizedField } from "@/components/shared/localized-field";
import { useT } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/localized";

type L = Record<Locale, string>;

export type CompanyFormValues = {
  email: string;
  phone: string;
  whatsapp: string;
  icpNumber: string;
  catalogueUrl: string;
  replyWithin: L;
  footerAddress: L;
  salesName: string;
  salesRole: L;
  salesBase: L;
  salesWhatsapp: string;
  salesEmail: string;
  salesWeb: string;
  socials: string; // one "network url" per line
};

function Text({
  name,
  label,
  help,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  help?: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

export function CompanyForm({
  action,
  defaultValues: v,
  canEdit,
}: {
  action: (prevState: string | undefined, formData: FormData) => Promise<string | undefined>;
  defaultValues: CompanyFormValues;
  canEdit: boolean;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const { dict } = useT();
  const t = dict.company;

  return (
    <form
      className="max-w-2xl"
      // Submitted by hand so a validation error doesn't reset the fields
      // (see VideoForm).
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {/* A staff member sees the details but can't change them. */}
      <fieldset disabled={!canEdit} className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.contactTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Text name="email" type="email" label={t.email} defaultValue={v.email} />
            <Text name="phone" label={t.phone} help={t.phoneHelp} defaultValue={v.phone} />
            <Text name="whatsapp" label={t.whatsapp} defaultValue={v.whatsapp} />
            <div className="grid gap-2">
              <LocalizedField name="replyWithin" label={t.replyWithin} defaults={v.replyWithin} />
              <p className="text-xs text-muted-foreground">{t.replyWithinHelp}</p>
            </div>
            <div className="grid gap-2">
              <LocalizedField
                name="footerAddress"
                label={t.footerAddress}
                defaults={v.footerAddress}
                multiline
                optional
              />
              <p className="text-xs text-muted-foreground">{t.footerAddressHelp}</p>
            </div>
            <Text name="icpNumber" label={t.icpNumber} help={t.icpHelp} defaultValue={v.icpNumber} />
            <Text
              name="catalogueUrl"
              type="url"
              label={t.catalogueUrl}
              help={t.catalogueHelp}
              defaultValue={v.catalogueUrl}
            />
            <div className="grid gap-2">
              <Label htmlFor="socials">{t.socials}</Label>
              <Textarea id="socials" name="socials" rows={3} defaultValue={v.socials} />
              <p className="text-xs text-muted-foreground">{t.socialsHelp}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.salesTitle}</CardTitle>
            <p className="text-xs text-muted-foreground">{t.salesHelp}</p>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Text name="salesName" label={t.salesName} defaultValue={v.salesName} />
            <LocalizedField name="salesRole" label={t.salesRole} defaults={v.salesRole} />
            <LocalizedField name="salesBase" label={t.salesBase} defaults={v.salesBase} />
            <Text name="salesEmail" type="email" label={t.salesEmail} defaultValue={v.salesEmail} />
            <Text name="salesWhatsapp" label={t.salesWhatsapp} defaultValue={v.salesWhatsapp} />
            <Text name="salesWeb" label={t.salesWeb} defaultValue={v.salesWeb} />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {canEdit && (
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? t.saving : t.save}
            </Button>
          </div>
        )}
      </fieldset>
    </form>
  );
}
