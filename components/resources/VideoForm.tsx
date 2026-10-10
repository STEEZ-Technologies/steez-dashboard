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
import { useT } from "@/lib/i18n/provider";
import { Bilingual } from "@/components/shared/language-tabs";
import { parseYouTube } from "@/lib/youtube";
import type { VideoKindValue } from "@/components/resources/videos-table";

type VideoFormValues = {
  video: string; // the YouTube link
  short: boolean;
  kind: VideoKindValue;
  titleEn: string;
  titleZh: string;
  published: boolean;
};

export function VideoForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (
    prevState: string | undefined,
    formData: FormData,
  ) => Promise<string | undefined>;
  defaultValues?: Partial<VideoFormValues>;
  submitLabel: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const { dict } = useT();
  const t = dict.videos;
  const [kind, setKind] = useState<VideoKindValue>(defaultValues?.kind ?? "PRODUCT");
  const [short, setShort] = useState(defaultValues?.short ?? false);
  const [published, setPublished] = useState(defaultValues?.published ?? true);

  const kindItems = useMemo(
    () => ({
      PRESS: t.kindPress,
      DISTRIBUTOR: t.kindDistributor,
      TRAINING: t.kindTraining,
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
      <input type="hidden" name="short" value={short ? "on" : ""} />
      <input type="hidden" name="published" value={published ? "on" : ""} />

      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-2">
            <Label htmlFor="video">{t.link}</Label>
            <Input
              id="video"
              name="video"
              type="url"
              inputMode="url"
              placeholder={t.linkPh}
              defaultValue={defaultValues?.video}
              // A /shorts/ link turns the switch on by itself.
              onChange={(e) => {
                if (parseYouTube(e.target.value)?.short) setShort(true);
              }}
              required
            />
            <p className="text-xs text-muted-foreground">{t.linkHelp}</p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={short} onCheckedChange={setShort} /> {t.isShort}
          </label>

          <div className="grid gap-2">
            <Label>{t.type}</Label>
            <Select value={kind} onValueChange={(v) => v && setKind(v as VideoKindValue)} items={kindItems}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRODUCT">{t.kindProduct}</SelectItem>
                <SelectItem value="TRAINING">{t.kindTraining}</SelectItem>
                <SelectItem value="DISTRIBUTOR">{t.kindDistributor}</SelectItem>
                <SelectItem value="PRESS">{t.kindPress}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
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
            <p className="text-xs text-muted-foreground">{t.titleHelp}</p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={published} onCheckedChange={setPublished} /> {t.published}
          </label>

          {!defaultValues && <p className="text-xs text-muted-foreground">{t.posterNote}</p>}

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
