"use client";

import { startTransition, useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LocalizedField } from "@/components/shared/localized-field";
import { useT } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/localized";

type L = Record<Locale, string>;

export type HomeContentFormValues = {
  heroTitle: L;
  heroSub: L;
  stats: { figure: L; unit: L; label: L; body: L; href: string }[];
};

export function HomeContentForm({
  action,
  defaultValues: v,
}: {
  action: (prevState: string | undefined, formData: FormData) => Promise<string | undefined>;
  defaultValues: HomeContentFormValues;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const { dict } = useT();
  const t = dict.homepage;

  return (
    <form
      className="grid max-w-2xl gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t.hero}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <LocalizedField name="heroTitle" label={t.heroTitle} defaults={v.heroTitle} required />
          <LocalizedField name="heroSub" label={t.heroSub} defaults={v.heroSub} required multiline />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t.stats}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.statsHelp}</p>
      </div>

      {v.stats.map((s, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle>{t.stat.replace("{n}", String(i + 1))}</CardTitle>
            <CardDescription>{s.label.en}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <LocalizedField name={`stat${i}_figure`} label={t.figure} defaults={s.figure} required optional />
                <p className="text-xs text-muted-foreground">{t.figureHelp}</p>
              </div>
              <LocalizedField name={`stat${i}_unit`} label={t.unit} defaults={s.unit} />
            </div>
            <LocalizedField name={`stat${i}_label`} label={t.label} defaults={s.label} required />
            <LocalizedField name={`stat${i}_body`} label={t.body} defaults={s.body} multiline />
            <div className="grid gap-2">
              <Label htmlFor={`stat${i}_href`}>{t.href}</Label>
              <Input id={`stat${i}_href`} name={`stat${i}_href`} defaultValue={s.href} placeholder="/information/" />
              <p className="text-xs text-muted-foreground">{t.hrefHelp}</p>
            </div>
          </CardContent>
        </Card>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t.saving : dict.actions.saveChanges}
        </Button>
      </div>
    </form>
  );
}
