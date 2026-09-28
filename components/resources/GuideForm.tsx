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

type GuideReaderValue = "DISTRIBUTOR" | "CUSTOMER" | "BOTH";

type GuideFormValues = {
  slug: string;
  reader: GuideReaderValue;
  titleEn: string;
  titleZh: string;
  standfirstEn: string;
  standfirstZh: string;
  minutes: number;
  imagePath: string;
  imageAltEn: string;
  imageAltZh: string;
  imageDistributorPath: string;
  imageDistributorAltEn: string;
  imageDistributorAltZh: string;
  imageCustomerPath: string;
  imageCustomerAltEn: string;
  imageCustomerAltZh: string;
  published: boolean;
};

export function GuideForm({
  action,
  defaultValues,
  defaultImageUrl,
  defaultDistributorImageUrl,
  defaultCustomerImageUrl,
  submitLabel,
}: {
  action: (
    prevState: string | undefined,
    formData: FormData,
  ) => Promise<string | undefined>;
  defaultValues?: Partial<GuideFormValues>;
  defaultImageUrl?: string;
  defaultDistributorImageUrl?: string;
  defaultCustomerImageUrl?: string;
  submitLabel: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const { dict } = useT();
  const t = dict.resources;
  const [reader, setReader] = useState<GuideReaderValue>(defaultValues?.reader ?? "BOTH");
  const [published, setPublished] = useState(defaultValues?.published ?? true);

  const readerItems = useMemo(
    () => ({
      DISTRIBUTOR: t.readerDistributor,
      CUSTOMER: t.readerCustomer,
      BOTH: t.readerBoth,
    }),
    [t],
  );

  return (
    <form action={formAction} className="max-w-2xl">
      <input type="hidden" name="reader" value={reader} />
      <input type="hidden" name="published" value={published ? "on" : ""} />

      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="slug">Web address</Label>
              <Input id="slug" name="slug" defaultValue={defaultValues?.slug} required />
              <p className="text-xs text-muted-foreground">
                The end of the guide&apos;s link. Lowercase words separated by dashes.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minutes">Minutes to read</Label>
              <Input
                id="minutes"
                name="minutes"
                type="number"
                min={1}
                defaultValue={defaultValues?.minutes ?? 5}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="titleEn">Title (English)</Label>
              <Input id="titleEn" name="titleEn" defaultValue={defaultValues?.titleEn} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="titleZh">Title (Chinese)</Label>
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
                placeholder="One or two sentences shown under the title"
                defaultValue={defaultValues?.standfirstEn}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="standfirstZh">Short summary (Chinese)</Label>
              <Textarea
                id="standfirstZh"
                name="standfirstZh"
                rows={2}
                placeholder="One or two sentences shown under the title"
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
                placeholder="E.g. A distributor inspecting a commercial RO system"
                defaultValue={defaultValues?.imageAltEn}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageAltZh">Describe the photo (Chinese)</Label>
              <Input id="imageAltZh" name="imageAltZh" defaultValue={defaultValues?.imageAltZh} />
            </div>
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">
            Read aloud by screen readers and used by search engines — say what&apos;s in the
            photo, in a plain sentence.
          </p>

          <details className="group rounded-lg border px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium select-none">
              Per-reader photo overrides{" "}
              <span className="font-normal text-muted-foreground">
                (optional — falls back to the cover photo above)
              </span>
            </summary>
            <div className="mt-4 grid gap-5">
              <div>
                <p className="mb-2 text-sm font-medium">Distributor version</p>
                <ImageUploadField
                  name="imageDistributorPath"
                  label="Photo"
                  defaultValue={defaultValues?.imageDistributorPath}
                  defaultUrl={defaultDistributorImageUrl}
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="imageDistributorAltEn">Describe the photo (English)</Label>
                    <Input
                      id="imageDistributorAltEn"
                      name="imageDistributorAltEn"
                      defaultValue={defaultValues?.imageDistributorAltEn}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imageDistributorAltZh">Describe the photo (Chinese)</Label>
                    <Input
                      id="imageDistributorAltZh"
                      name="imageDistributorAltZh"
                      defaultValue={defaultValues?.imageDistributorAltZh}
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Customer version</p>
                <ImageUploadField
                  name="imageCustomerPath"
                  label="Photo"
                  defaultValue={defaultValues?.imageCustomerPath}
                  defaultUrl={defaultCustomerImageUrl}
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="imageCustomerAltEn">Describe the photo (English)</Label>
                    <Input
                      id="imageCustomerAltEn"
                      name="imageCustomerAltEn"
                      defaultValue={defaultValues?.imageCustomerAltEn}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imageCustomerAltZh">Describe the photo (Chinese)</Label>
                    <Input
                      id="imageCustomerAltZh"
                      name="imageCustomerAltZh"
                      defaultValue={defaultValues?.imageCustomerAltZh}
                    />
                  </div>
                </div>
              </div>
            </div>
          </details>

          <div className="grid gap-2">
            <Label>Who this guide is for</Label>
            <Select value={reader} onValueChange={(v) => v && setReader(v as GuideReaderValue)} items={readerItems}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DISTRIBUTOR">{t.readerDistributor}</SelectItem>
                <SelectItem value="CUSTOMER">{t.readerCustomer}</SelectItem>
                <SelectItem value="BOTH">{t.readerBoth}</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
