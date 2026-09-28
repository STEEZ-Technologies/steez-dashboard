"use client";

import { useActionState, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type ArticleTopicValue =
  | "REVERSE_OSMOSIS"
  | "CHOOSING"
  | "MAINTENANCE"
  | "WATER_QUALITY"
  | "SUSTAINABILITY"
  | "COMPANY";

type ArticleFormValues = {
  slug: string;
  titleEn: string;
  titleZh: string;
  standfirstEn: string;
  standfirstZh: string;
  metaTitleEn: string;
  metaTitleZh: string;
  keywordsEnText: string;
  keywordsZhText: string;
  imagePath: string;
  imageAltEn: string;
  imageAltZh: string;
  topic: ArticleTopicValue;
  published: boolean;
};

export function ArticleForm({
  action,
  defaultValues,
  defaultImageUrl,
  submitLabel,
}: {
  action: (
    prevState: string | undefined,
    formData: FormData,
  ) => Promise<string | undefined>;
  defaultValues?: Partial<ArticleFormValues>;
  defaultImageUrl?: string;
  submitLabel: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const { dict } = useT();
  const t = dict.news;
  const [topic, setTopic] = useState<ArticleTopicValue>(defaultValues?.topic ?? "COMPANY");
  const [published, setPublished] = useState(defaultValues?.published ?? true);

  const topicItems = useMemo(
    () => ({
      REVERSE_OSMOSIS: t.topicReverseOsmosis,
      CHOOSING: t.topicChoosing,
      MAINTENANCE: t.topicMaintenance,
      WATER_QUALITY: t.topicWaterQuality,
      SUSTAINABILITY: t.topicSustainability,
      COMPANY: t.topicCompany,
    }),
    [t],
  );

  return (
    <form action={formAction} className="max-w-2xl">
      <input type="hidden" name="topic" value={topic} />
      <input type="hidden" name="published" value={published ? "on" : ""} />

      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-2">
            <Label htmlFor="slug">Web address</Label>
            <Input id="slug" name="slug" defaultValue={defaultValues?.slug} required />
            <p className="text-xs text-muted-foreground">
              The end of the article&apos;s link, e.g. komibright.com/news/
              <span className="font-medium text-foreground">your-web-address</span>. Lowercase
              words separated by dashes, no spaces.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="titleEn">Headline (English)</Label>
              <Input
                id="titleEn"
                name="titleEn"
                defaultValue={defaultValues?.titleEn}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="titleZh">Headline (Chinese)</Label>
              <Input id="titleZh" name="titleZh" defaultValue={defaultValues?.titleZh} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="standfirstEn">Short summary (English)</Label>
              <Textarea
                id="standfirstEn"
                name="standfirstEn"
                rows={2}
                placeholder="One or two sentences shown under the headline"
                defaultValue={defaultValues?.standfirstEn}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="standfirstZh">Short summary (Chinese)</Label>
              <Textarea
                id="standfirstZh"
                name="standfirstZh"
                rows={2}
                placeholder="One or two sentences shown under the headline"
                defaultValue={defaultValues?.standfirstZh}
              />
            </div>
          </div>

          <ImageUploadField
            name="imagePath"
            label="Cover photo"
            defaultValue={defaultValues?.imagePath}
            defaultUrl={defaultImageUrl}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="imageAltEn">Describe the photo (English)</Label>
              <Input
                id="imageAltEn"
                name="imageAltEn"
                placeholder="E.g. A KomiBright system installed under a kitchen sink"
                defaultValue={defaultValues?.imageAltEn}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageAltZh">Describe the photo (Chinese)</Label>
              <Input
                id="imageAltZh"
                name="imageAltZh"
                placeholder="E.g. 安装在厨房水槽下的康米佳净水系统"
                defaultValue={defaultValues?.imageAltZh}
              />
            </div>
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">
            Read aloud by screen readers and used by search engines — say what&apos;s in the
            photo, in a plain sentence.
          </p>

          <div className="grid gap-2">
            <Label>Topic</Label>
            <Select value={topic} onValueChange={(v) => v && setTopic(v as ArticleTopicValue)} items={topicItems}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REVERSE_OSMOSIS">{t.topicReverseOsmosis}</SelectItem>
                <SelectItem value="CHOOSING">{t.topicChoosing}</SelectItem>
                <SelectItem value="MAINTENANCE">{t.topicMaintenance}</SelectItem>
                <SelectItem value="WATER_QUALITY">{t.topicWaterQuality}</SelectItem>
                <SelectItem value="SUSTAINABILITY">{t.topicSustainability}</SelectItem>
                <SelectItem value="COMPANY">{t.topicCompany}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <details className="group rounded-lg border px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium select-none">
              Google search details{" "}
              <span className="font-normal text-muted-foreground">(optional — safe to skip)</span>
            </summary>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="keywordsEnText">
                  Search terms (English){" "}
                  <span className="font-normal text-muted-foreground">
                    (separated by commas, most important first)
                  </span>
                </Label>
                <Input
                  id="keywordsEnText"
                  name="keywordsEnText"
                  placeholder="E.g. reverse osmosis water filtration, RO water purification"
                  defaultValue={defaultValues?.keywordsEnText}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="keywordsZhText">
                  Search terms (Chinese){" "}
                  <span className="font-normal text-muted-foreground">
                    (separated by commas — leave blank to emit none on /zh/)
                  </span>
                </Label>
                <Input
                  id="keywordsZhText"
                  name="keywordsZhText"
                  defaultValue={defaultValues?.keywordsZhText}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="metaTitleEn">Title shown in Google (English)</Label>
                  <Input id="metaTitleEn" name="metaTitleEn" defaultValue={defaultValues?.metaTitleEn} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="metaTitleZh">Title shown in Google (Chinese)</Label>
                  <Input id="metaTitleZh" name="metaTitleZh" defaultValue={defaultValues?.metaTitleZh} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                The short summary above doubles as the description shown in Google — there's no
                separate field for it.
              </p>
            </div>
          </details>

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
