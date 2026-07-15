"use client";

import { useActionState, useState } from "react";
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

type ProductFormValues = {
  slug: string;
  model: string;
  name: string;
  description: string;
  imagePath: string;
  categoryId: string;
  specsText: string;
  featured: boolean;
  published: boolean;
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

  return (
    <form action={formAction} className="max-w-2xl">
      <input type="hidden" name="categoryId" value={categoryId === "none" ? "" : categoryId} />
      <input type="hidden" name="featured" value={featured ? "on" : ""} />
      <input type="hidden" name="published" value={published ? "on" : ""} />

      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={defaultValues?.slug} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" defaultValue={defaultValues?.model} required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={defaultValues?.name} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={defaultValues?.description}
            />
          </div>

          <ImageUploadField
            name="imagePath"
            label="Product image"
            defaultValue={defaultValues?.imagePath}
            defaultUrl={defaultImageUrl}
          />

          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "none")}>
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

          <div className="grid gap-2">
            <Label htmlFor="specsText">
              Specs{" "}
              <span className="font-normal text-muted-foreground">
                (one “Key: Value” per line)
              </span>
            </Label>
            <Textarea
              id="specsText"
              name="specsText"
              rows={5}
              className="font-mono text-sm"
              placeholder={"Height: 1000mm\nLoad Capacity: 400kg"}
              defaultValue={defaultValues?.specsText}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={featured} onCheckedChange={setFeatured} /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={published} onCheckedChange={setPublished} /> Published
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
