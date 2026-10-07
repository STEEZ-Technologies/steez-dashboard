"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "@/components/shared/ImageUploadField";
import { useT } from "@/lib/i18n/provider";
import { Bilingual } from "@/components/shared/language-tabs";
import type { NewsEventKindValue } from "@/components/news/events-table";

type DatingValue = "DAYS" | "YEAR" | "NONE";

type EventFormValues = {
  slug: string;
  kind: NewsEventKindValue;
  titleEn: string;
  titleZh: string;
  placeEn: string;
  placeZh: string;
  booth: string;
  dating: DatingValue;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  year: string;
  imagePath: string;
  imageAltEn: string;
  imageAltZh: string;
  published: boolean;
};

export function EventForm({
  action,
  defaultValues,
  defaultImageUrl,
  submitLabel,
}: {
  action: (
    prevState: string | undefined,
    formData: FormData,
  ) => Promise<string | undefined>;
  defaultValues?: Partial<EventFormValues>;
  defaultImageUrl?: string;
  submitLabel: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const { dict } = useT();
  const t = dict.newsEvents;
  const [kind, setKind] = useState<NewsEventKindValue>(defaultValues?.kind ?? "EXHIBITION");
  const [dating, setDating] = useState<DatingValue>(defaultValues?.dating ?? "DAYS");
  const [published, setPublished] = useState(defaultValues?.published ?? true);

  const kindItems = useMemo(
    () => ({
      EXHIBITION: t.kindExhibition,
      VISIT: t.kindVisit,
      PRESS: t.kindPress,
      PRODUCT: t.kindProduct,
    }),
    [t],
  );
  const datingItems = useMemo<Record<DatingValue, string>>(
    () => ({ DAYS: t.datingDays, YEAR: t.datingYear, NONE: t.datingNone }),
    [t],
  );

  return (
    <form
      className="max-w-2xl"
      // Submitted by hand rather than through `action`: React resets a form
      // after its action runs, which wiped every field whenever the server
      // sent back a validation error.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="dating" value={dating} />
      <input type="hidden" name="published" value={published ? "on" : ""} />
      {/* Always posted, so the schema sees "" rather than a missing key when
          the date inputs below are hidden. */}
      {dating !== "DAYS" && (
        <>
          <input type="hidden" name="startDate" value="" />
          <input type="hidden" name="endDate" value="" />
        </>
      )}
      {dating !== "YEAR" && <input type="hidden" name="year" value="" />}

      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-2">
            <Label>{t.type}</Label>
            <Select value={kind} onValueChange={(v) => v && setKind(v as NewsEventKindValue)} items={kindItems}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXHIBITION">{t.kindExhibition}</SelectItem>
                <SelectItem value="VISIT">{t.kindVisit}</SelectItem>
                <SelectItem value="PRESS">{t.kindPress}</SelectItem>
                <SelectItem value="PRODUCT">{t.kindProduct}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Bilingual
            en={
              <>
                <Label htmlFor="titleEn">{t.titleEn}</Label>
                <Input
                  id="titleEn"
                  name="titleEn"
                  placeholder={t.titleEnPh}
                  defaultValue={defaultValues?.titleEn}
                  required
                />
              </>
            }
            zh={
              <>
                <Label htmlFor="titleZh">{t.titleZh}</Label>
                <Input
                  id="titleZh"
                  name="titleZh"
                  placeholder={t.titleZhPh}
                  defaultValue={defaultValues?.titleZh}
                />
              </>
            }
          />

          <div className="grid gap-2">
            <Label htmlFor="slug">{t.slug}</Label>
            <Input
              id="slug"
              name="slug"
              placeholder="aquatech-2026"
              defaultValue={defaultValues?.slug}
              required
            />
            <p className="text-xs text-muted-foreground">{t.slugHelp}</p>
          </div>

          <div className="grid gap-2">
            <Label>{t.when}</Label>
            <Select value={dating} onValueChange={(v) => v && setDating(v as DatingValue)} items={datingItems}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAYS">{datingItems.DAYS}</SelectItem>
                <SelectItem value="YEAR">{datingItems.YEAR}</SelectItem>
                <SelectItem value="NONE">{datingItems.NONE}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dating === "DAYS" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="startDate">{t.firstDay}</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={defaultValues?.startDate}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">
                  {t.lastDay} <span className="font-normal text-muted-foreground">{t.lastDayHint}</span>
                </Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={defaultValues?.endDate}
                />
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">{t.datesHelp}</p>
            </div>
          )}

          {dating === "YEAR" && (
            <div className="grid gap-2">
              <Label htmlFor="year">{t.year}</Label>
              <Input
                id="year"
                name="year"
                inputMode="numeric"
                placeholder="2023"
                defaultValue={defaultValues?.year}
                required
              />
            </div>
          )}

          <Bilingual
            optional
            en={
              <>
                <Label htmlFor="placeEn">{t.placeEn}</Label>
                <Input
                  id="placeEn"
                  name="placeEn"
                  placeholder={t.placeEnPh}
                  defaultValue={defaultValues?.placeEn}
                />
              </>
            }
            zh={
              <>
                <Label htmlFor="placeZh">{t.placeZh}</Label>
                <Input
                  id="placeZh"
                  name="placeZh"
                  placeholder={t.placeZhPh}
                  defaultValue={defaultValues?.placeZh}
                />
              </>
            }
          />

          {kind === "EXHIBITION" ? (
            <div className="grid gap-2">
              <Label htmlFor="booth">
                {t.booth} <span className="font-normal text-muted-foreground">{t.optional}</span>
              </Label>
              <Input
                id="booth"
                name="booth"
                placeholder="E7G01"
                defaultValue={defaultValues?.booth}
              />
            </div>
          ) : (
            <input type="hidden" name="booth" value="" />
          )}

          <ImageUploadField
            name="imagePath"
            label={t.photo}
            defaultValue={defaultValues?.imagePath}
            defaultUrl={defaultImageUrl}
          />

          <Bilingual
            optional
            en={
              <>
                <Label htmlFor="imageAltEn">{t.altEn}</Label>
                <Input
                  id="imageAltEn"
                  name="imageAltEn"
                  placeholder={t.altEnPh}
                  defaultValue={defaultValues?.imageAltEn}
                />
              </>
            }
            zh={
              <>
                <Label htmlFor="imageAltZh">{t.altZh}</Label>
                <Input
                  id="imageAltZh"
                  name="imageAltZh"
                  defaultValue={defaultValues?.imageAltZh}
                />
              </>
            }
          />

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
