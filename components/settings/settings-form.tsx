"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateTenantSettings } from "@/app/(dashboard)/settings/actions";

export function SettingsForm({
  name,
  slug,
  canManage,
}: {
  name: string;
  slug: string;
  canManage: boolean;
}) {
  const [error, formAction, pending] = useActionState(updateTenantSettings, undefined);

  return (
    <form action={formAction} className="max-w-xl">
      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input id="name" name="name" defaultValue={name} disabled={!canManage} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Public slug</Label>
            <Input id="slug" value={slug} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              Used in your public catalog API path. Changing it would break the live
              site integration, so it’s locked.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {canManage ? (
            <div>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Only owners can edit workspace settings.
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
