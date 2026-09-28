"use client";

import { useActionState, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "@/components/shared/ImageUploadField";
import { SpecRows } from "@/components/products/spec-rows";

type ProductKindValue = "MACHINE" | "ACCESSORY";
type UseCaseValue = "KITCHEN" | "HOSPITALITY" | "LAB" | "MOBILE";
type DispensingValue = "TANK" | "JAR" | "DIRECT";
type SourceValue = "MAINS" | "OPEN";

const USE_CASES: { value: UseCaseValue; label: string }[] = [
  { value: "KITCHEN", label: "Kitchen" },
  { value: "HOSPITALITY", label: "Hospitality" },
  { value: "LAB", label: "Lab" },
  { value: "MOBILE", label: "Mobile" },
];

type ProductFormValues = {
  slug: string;
  model: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  imagePath: string;
  categoryId: string;
  specsText: string;
  kind: ProductKindValue;
  useCases: UseCaseValue[];
  featured: boolean;
  published: boolean;
  fit?: {
    litresPerDay: number | null;
    minBar: number | null;
    sources: SourceValue[];
    dispensing: DispensingValue;
    powered: boolean;
  } | null;
};

export function ProductForm({
  action,
  categories,
  defaultValues,
  defaultImageUrl,
  submitLabel,
}: {
  action: (
    prevState: string | undefined,
    formData: FormData,
  ) => Promise<string | undefined>;
  categories: { id: string; label: string }[];
  defaultValues?: Partial<ProductFormValues>;
  defaultImageUrl?: string;
  submitLabel: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId ?? "none");
  const [featured, setFeatured] = useState(defaultValues?.featured ?? false);
  const [published, setPublished] = useState(defaultValues?.published ?? true);
  const [kind, setKind] = useState<ProductKindValue>(defaultValues?.kind ?? "MACHINE");
  const [useCases, setUseCases] = useState<UseCaseValue[]>(defaultValues?.useCases ?? []);
  const [hasFit, setHasFit] = useState(Boolean(defaultValues?.fit));
  const [sources, setSources] = useState<SourceValue[]>(defaultValues?.fit?.sources ?? []);
  const [dispensing, setDispensing] = useState<DispensingValue>(
    defaultValues?.fit?.dispensing ?? "TANK",
  );
  const [powered, setPowered] = useState(defaultValues?.fit?.powered ?? false);

  const toggleUseCase = (value: UseCaseValue) =>
    setUseCases((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  const toggleSource = (value: SourceValue) =>
    setSources((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  // `items` maps value -> label so the trigger shows the category name; without
  // it <SelectValue> renders the raw value (the category id).
  const categoryItems = useMemo(
    () => ({
      none: "No category",
      ...Object.fromEntries(categories.map((c) => [c.id, c.label])),
    }),
    [categories],
  );

  return (
    <form action={formAction} className="max-w-2xl">
      <input type="hidden" name="categoryId" value={categoryId === "none" ? "" : categoryId} />
      <input type="hidden" name="featured" value={featured ? "on" : ""} />
      <input type="hidden" name="published" value={published ? "on" : ""} />
      <input type="hidden" name="kind" value={kind} />
      {useCases.map((v) => (
        <input key={v} type="hidden" name="useCases" value={v} />
      ))}
      <input type="hidden" name="hasFit" value={hasFit ? "on" : ""} />
      <input type="hidden" name="dispensing" value={dispensing} />
      <input type="hidden" name="powered" value={powered ? "on" : ""} />
      {sources.map((v) => (
        <input key={v} type="hidden" name="sources" value={v} />
      ))}

      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="slug">Web address</Label>
              <Input id="slug" name="slug" defaultValue={defaultValues?.slug} required />
              <p className="text-xs text-muted-foreground">
                The end of the product&apos;s link, e.g. komibright.com/products/
                <span className="font-medium text-foreground">your-web-address</span>. Lowercase
                words separated by dashes, no spaces.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Model code</Label>
              <Input id="model" name="model" defaultValue={defaultValues?.model} required />
              <p className="text-xs text-muted-foreground">
                The catalogue code printed on the unit, e.g. KB-C25R.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name (English)</Label>
              <Input id="name" name="name" defaultValue={defaultValues?.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameZh">Name (Chinese)</Label>
              <Input id="nameZh" name="nameZh" defaultValue={defaultValues?.nameZh} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="description">Description (English)</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={defaultValues?.description}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descriptionZh">Description (Chinese)</Label>
              <Textarea
                id="descriptionZh"
                name="descriptionZh"
                rows={3}
                defaultValue={defaultValues?.descriptionZh}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Kind</Label>
            <Select
              value={kind}
              onValueChange={(v) => v && setKind(v as ProductKindValue)}
              items={{ MACHINE: "Machine", ACCESSORY: "Accessory" }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MACHINE">Machine</SelectItem>
                <SelectItem value="ACCESSORY">Accessory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Use cases</Label>
            <div className="flex flex-wrap gap-4">
              {USE_CASES.map((uc) => (
                <label key={uc.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={useCases.includes(uc.value)}
                    onCheckedChange={() => toggleUseCase(uc.value)}
                  />
                  {uc.label}
                </label>
              ))}
            </div>
          </div>

          <ImageUploadField
            name="imagePath"
            label="Product image"
            defaultValue={defaultValues?.imagePath}
            defaultUrl={defaultImageUrl}
          />
          <p className="-mt-3 text-xs text-muted-foreground">
            For this dashboard&apos;s own product list only — the photos on the live website are
            fixed and verified separately, so this photo won&apos;t change anything customers see.
          </p>

          <div className="grid gap-2">
            <Label>Category</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => setCategoryId(v ?? "none")}
              items={categoryItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SpecRows initialText={defaultValues?.specsText} />

          <div className="grid gap-3 rounded-lg border p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch checked={hasFit} onCheckedChange={setHasFit} /> Water capacity &amp;
              pressure
            </label>
            <p className="text-sm text-muted-foreground">
              Used by the &quot;Find your system&quot; quiz on the website to match customers to
              this product. Leave off if this machine's numbers aren't in the catalogue yet — an
              empty field means "not published," never a guess.
            </p>
            {hasFit && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="litresPerDayText">
                    How much water it makes per day (litres)
                  </Label>
                  <Input
                    id="litresPerDayText"
                    name="litresPerDayText"
                    type="number"
                    defaultValue={defaultValues?.fit?.litresPerDay ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minBarText">
                    Lowest water pressure it needs to work (bar)
                  </Label>
                  <Input
                    id="minBarText"
                    name="minBarText"
                    type="number"
                    defaultValue={defaultValues?.fit?.minBar ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Water sources</Label>
                  <div className="flex flex-wrap gap-4">
                    {(["MAINS", "OPEN"] as SourceValue[]).map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={sources.includes(s)}
                          onCheckedChange={() => toggleSource(s)}
                        />
                        {s === "MAINS" ? "Mains" : "Open water"}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Dispensing</Label>
                  <Select
                    value={dispensing}
                    onValueChange={(v) => v && setDispensing(v as DispensingValue)}
                    items={{ TANK: "Tank", JAR: "Jar", DIRECT: "Direct" }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TANK">Tank</SelectItem>
                      <SelectItem value="JAR">Jar</SelectItem>
                      <SelectItem value="DIRECT">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={powered} onCheckedChange={setPowered} /> Powered (pump/electricity)
                </label>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={featured} onCheckedChange={setFeatured} /> Featured
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Marks it in this dashboard&apos;s own list — not shown on the website yet.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={published} onCheckedChange={setPublished} /> Published (visible on
              the website)
            </label>
          </div>

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
