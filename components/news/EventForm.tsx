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

const DATING_ITEMS: Record<DatingValue, string> = {
  DAYS: "On set dates",
  YEAR: "Only the year is known",
  NONE: "No date",
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
            <Label>Type</Label>
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
                <Label htmlFor="titleEn">Title (English)</Label>
                <Input
                  id="titleEn"
                  name="titleEn"
                  placeholder="E.g. Aquatech China 2026, Shanghai"
                  defaultValue={defaultValues?.titleEn}
                  required
                />
              </>
            }
            zh={
              <>
                <Label htmlFor="titleZh">Title (Chinese)</Label>
                <Input
                  id="titleZh"
                  name="titleZh"
                  placeholder="E.g. 2026 上海国际水展"
                  defaultValue={defaultValues?.titleZh}
                />
              </>
            }
          />

          <div className="grid gap-2">
            <Label htmlFor="slug">Short code</Label>
            <Input
              id="slug"
              name="slug"
              placeholder="aquatech-2026"
              defaultValue={defaultValues?.slug}
              required
            />
            <p className="text-xs text-muted-foreground">
              Never shown on the site — it just keeps this entry matched to its translations.
              Lowercase words separated by dashes, no spaces.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>When</Label>
            <Select value={dating} onValueChange={(v) => v && setDating(v as DatingValue)} items={DATING_ITEMS}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAYS">{DATING_ITEMS.DAYS}</SelectItem>
                <SelectItem value="YEAR">{DATING_ITEMS.YEAR}</SelectItem>
                <SelectItem value="NONE">{DATING_ITEMS.NONE}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dating === "DAYS" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="startDate">First day</Label>
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
                  Last day <span className="font-normal text-muted-foreground">(if more than one)</span>
                </Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={defaultValues?.endDate}
                />
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Until the last day has passed, the event is marked upcoming. An upcoming
                exhibition with a venue and a booth number is also featured on the site&apos;s
                homepage. After the last day it becomes an ordinary past entry on its own.
              </p>
            </div>
          )}

          {dating === "YEAR" && (
            <div className="grid gap-2">
              <Label htmlFor="year">Year</Label>
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
                <Label htmlFor="placeEn">Where (English)</Label>
                <Input
                  id="placeEn"
                  name="placeEn"
                  placeholder="E.g. Shanghai New International Expo Centre (Pudong)"
                  defaultValue={defaultValues?.placeEn}
                />
              </>
            }
            zh={
              <>
                <Label htmlFor="placeZh">Where (Chinese)</Label>
                <Input
                  id="placeZh"
                  name="placeZh"
                  placeholder="E.g. 上海新国际博览中心（浦东）"
                  defaultValue={defaultValues?.placeZh}
                />
              </>
            }
          />

          {kind === "EXHIBITION" ? (
            <div className="grid gap-2">
              <Label htmlFor="booth">
                Booth number <span className="font-normal text-muted-foreground">(optional)</span>
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
            label="Photo (optional)"
            defaultValue={defaultValues?.imagePath}
            defaultUrl={defaultImageUrl}
          />

          <Bilingual
            optional
            en={
              <>
                <Label htmlFor="imageAltEn">Describe the photo (English)</Label>
                <Input
                  id="imageAltEn"
                  name="imageAltEn"
                  placeholder="E.g. The KomiBright stand at Aquatech China"
                  defaultValue={defaultValues?.imageAltEn}
                />
              </>
            }
            zh={
              <>
                <Label htmlFor="imageAltZh">Describe the photo (Chinese)</Label>
                <Input
                  id="imageAltZh"
                  name="imageAltZh"
                  defaultValue={defaultValues?.imageAltZh}
                />
              </>
            }
          />

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={published} onCheckedChange={setPublished} /> Published
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
