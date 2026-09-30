"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/shared/ImageUploadField";
import { updateProfile } from "@/app/(dashboard)/settings/actions";
import { useT } from "@/lib/i18n/provider";

export function ProfileForm({
  name,
  avatarPath,
  avatarUrl,
  placeholderUrls,
}: {
  name: string;
  avatarPath: string;
  avatarUrl?: string;
  /** The site icon the sidebar shows while no picture is uploaded. */
  placeholderUrls?: string[];
}) {
  const [error, formAction, pending] = useActionState(updateProfile, undefined);
  const { dict } = useT();

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{dict.settings.profile}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="profileName">{dict.settings.displayName}</Label>
            <Input
              id="profileName"
              name="name"
              maxLength={60}
              defaultValue={name}
              autoComplete="name"
            />
            <p className="text-xs text-muted-foreground">{dict.settings.displayNameHelp}</p>
          </div>
          <ImageUploadField
            name="avatarPath"
            label={dict.settings.profilePicture}
            defaultValue={avatarPath}
            defaultUrl={avatarUrl}
            placeholderUrls={placeholderUrls}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? dict.settings.saving : dict.settings.saveProfile}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
