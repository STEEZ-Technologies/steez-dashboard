"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/shared/ImageUploadField";

type FinishFormValues = {
  key: string;
  materialLabel: string;
  accentHex: string;
  imagePath: string;
};

export function FinishForm({
  action,
  defaultValues,
  defaultImageUrl,
  submitLabel,
}: {
  action: (
    prevState: string | undefined,
    formData: FormData,
  ) => Promise<string | undefined>;
  defaultValues?: Partial<FinishFormValues>;
  defaultImageUrl?: string;
  submitLabel: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-xl">
      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="key">Key</Label>
              <Input id="key" name="key" defaultValue={defaultValues?.key} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="materialLabel">Material label</Label>
              <Input
                id="materialLabel"
                name="materialLabel"
                defaultValue={defaultValues?.materialLabel}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="accentHex">Accent color</Label>
            <Input
              id="accentHex"
              name="accentHex"
              type="color"
              defaultValue={defaultValues?.accentHex ?? "#000000"}
              className="h-10 w-20 p-1"
            />
          </div>
          <ImageUploadField
            name="imagePath"
            label="Finish image"
            defaultValue={defaultValues?.imagePath}
            defaultUrl={defaultImageUrl}
          />
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
