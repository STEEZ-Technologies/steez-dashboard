"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateTenantSettings } from "@/app/(dashboard)/settings/actions";
import { useT } from "@/lib/i18n/provider";

export function SettingsForm({
  name,
  slug,
  deployHookUrl,
  canManage,
}: {
  name: string;
  slug: string;
  deployHookUrl: string | null;
  canManage: boolean;
}) {
  const [error, formAction, pending] = useActionState(updateTenantSettings, undefined);
  const { dict } = useT();

  return (
    <form action={formAction} className="max-w-xl">
      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-2">
            <Label htmlFor="name">{dict.settings.workspaceName}</Label>
            <Input id="name" name="name" defaultValue={name} disabled={!canManage} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">{dict.settings.publicSlug}</Label>
            <Input id="slug" value={slug} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              {dict.settings.slugLockedNote}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deployHookUrl">{dict.publish.hookLabel}</Label>
            <Input
              id="deployHookUrl"
              name="deployHookUrl"
              type="url"
              inputMode="url"
              placeholder="https://api.vercel.com/v1/integrations/deploy/…"
              defaultValue={deployHookUrl ?? ""}
              disabled={!canManage}
            />
            <p className="text-xs text-muted-foreground">{dict.publish.hookHelp}</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {canManage ? (
            <div>
              <Button type="submit" disabled={pending}>
                {pending ? dict.settings.saving : dict.settings.saveChanges}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {dict.settings.ownerOnlyNote}
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
